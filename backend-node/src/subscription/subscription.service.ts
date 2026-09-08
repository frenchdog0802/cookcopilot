import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BadRequestError } from '../common/errors/http-errors';
import { nowUnixSeconds } from '../common/time';
import type { AppConfig } from '../config/env.schema';
import type {
  SubscriptionCatalogPlan,
  SubscriptionTierLimits,
} from '../config/env.constants';
import { EntitlementService } from '../entitlement/entitlement.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsageQuotaService } from '../usage-quota/usage-quota.service';
import type {
  GetPlansResponse,
  PlanDto,
  SubscriptionStatusDto,
  SyncPurchaseRequestDto,
  TierComparisonDto,
  ValidateReceiptRequestDto,
  ValidateReceiptResponseDto,
} from './dto/subscription.dto';

@Injectable()
export class SubscriptionService {
  private readonly subscriptionConfig: AppConfig['subscription'];
  private readonly stripeSecretKey?: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly usageQuotaService: UsageQuotaService,
    private readonly entitlementService: EntitlementService,
    configService: ConfigService,
  ) {
    const appConfig = configService.get<AppConfig>('app')!;
    this.subscriptionConfig = appConfig.subscription;
    this.stripeSecretKey = appConfig.optional.stripeSecretKey;
  }

  async isPro(userId: string): Promise<boolean> {
    return this.entitlementService.isPro(userId);
  }

  async isWithinSignupTrial(userId: string): Promise<boolean> {
    return this.entitlementService.isWithinSignupTrial(userId);
  }

  async getTrialEndsAt(userId: string): Promise<number | null> {
    return this.entitlementService.getTrialEndsAt(userId);
  }

  async getStatus(userId: string): Promise<SubscriptionStatusDto> {
    const active = await this.entitlementService.findActiveSubscription(userId);
    const paidPro = active != null;
    const trial =
      !paidPro && (await this.entitlementService.isWithinSignupTrial(userId));
    const pro = paidPro || trial;

    let planName: string | null = null;
    let expiresAt: number | null = null;

    if (active) {
      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { id: active.planId },
      });
      if (plan) {
        planName = plan.name;
      }
      expiresAt = active.currentPeriodEnd
        ? Number(active.currentPeriodEnd)
        : null;
    } else if (trial) {
      planName = 'Pro Trial';
      expiresAt = await this.entitlementService.getTrialEndsAt(userId);
    }

    const trialEndsAt = trial
      ? await this.entitlementService.getTrialEndsAt(userId)
      : null;

    return {
      isPro: pro,
      isTrial: trial,
      trialEndsAt,
      expiresAt,
      planName,
      usage: await this.usageQuotaService.getUsageSummary(userId),
    };
  }

  getPlansCatalog(): GetPlansResponse {
    return {
      plans: this.subscriptionConfig.plans.map((plan) => this.toPlanDto(plan)),
      free: this.toTierComparison(this.subscriptionConfig.free),
      pro: this.toTierComparison(this.subscriptionConfig.pro),
      trialDays: this.subscriptionConfig.trialDays,
      stripeCheckoutEnabled: this.isStripeCheckoutEnabled(),
    };
  }

  /**
   * IAP sync must not trust the client. Until Apple/Google verification is
   * wired, refuse to grant Pro from these endpoints (use Stripe webhook/checkout).
   */
  async syncPurchase(
    _userId: string,
    request: SyncPurchaseRequestDto,
  ): Promise<SubscriptionStatusDto> {
    this.assertKnownIapProduct(request.productId);
    throw new BadRequestError(
      'IAP purchase verification is not configured. Use Stripe checkout or contact support.',
    );
  }

  async validateReceipt(
    _userId: string,
    request: ValidateReceiptRequestDto,
  ): Promise<ValidateReceiptResponseDto> {
    this.assertKnownIapProduct(request.productId);
    if (!request.receipt?.trim()) {
      throw new BadRequestError('receipt is required');
    }

    throw new BadRequestError(
      'IAP receipt verification is not configured. Use Stripe checkout or contact support.',
    );
  }

  private assertKnownIapProduct(productId: string | undefined): void {
    if (!productId?.trim()) {
      throw new BadRequestError('productId is required');
    }
    const catalogPlan = this.subscriptionConfig.plans.find(
      (plan) =>
        productId === plan.productIdIos || productId === plan.productIdAndroid,
    );
    if (!catalogPlan) {
      throw new BadRequestError(`Unknown productId: ${productId}`);
    }
  }

  async applyStripeSubscription(
    userId: string,
    stripeCustomerId: string | null | undefined,
    stripeSubscriptionId: string | null | undefined,
    status: string,
    billingPeriod: string | null | undefined,
    periodStart: number | null | undefined,
    periodEnd: number | null | undefined,
  ): Promise<void> {
    if (!userId || !stripeSubscriptionId?.trim()) {
      return;
    }

    const catalogPlan = billingPeriod
      ? (this.subscriptionConfig.plans.find(
          (plan) =>
            plan.billingPeriod.toLowerCase() === billingPeriod.toLowerCase(),
        ) ?? null)
      : null;

    const plan = catalogPlan
      ? await this.findOrCreatePlan(catalogPlan)
      : await this.prisma.subscriptionPlan.findFirst({
          where: { isActive: true },
        });

    if (!plan) {
      return;
    }

    const now = nowUnixSeconds();
    const resolvedStart = periodStart ?? now;
    const resolvedEnd =
      periodEnd ?? this.defaultPeriodEnd(catalogPlan, resolvedStart);

    const byProvider = await this.prisma.subscription.findFirst({
      where: { providerSubscriptionId: stripeSubscriptionId },
    });
    const active = await this.entitlementService.findActiveSubscription(userId);
    const subscription = byProvider ?? active;

    if (!subscription) {
      await this.prisma.subscription.create({
        data: {
          userId,
          planId: plan.id,
          status,
          startAt: BigInt(resolvedStart),
          currentPeriodStart: BigInt(resolvedStart),
          currentPeriodEnd: BigInt(resolvedEnd),
          provider: 'stripe',
          providerCustomerId: stripeCustomerId ?? undefined,
          providerSubscriptionId: stripeSubscriptionId,
          createdAt: BigInt(now),
          updatedAt: BigInt(now),
        },
      });
      return;
    }

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        userId,
        planId: plan.id,
        status,
        currentPeriodStart: BigInt(resolvedStart),
        currentPeriodEnd: BigInt(resolvedEnd),
        provider: 'stripe',
        ...(stripeCustomerId?.trim()
          ? { providerCustomerId: stripeCustomerId }
          : {}),
        providerSubscriptionId: stripeSubscriptionId,
        updatedAt: BigInt(now),
      },
    });
  }

  async applyStripeSubscriptionByProviderId(
    stripeSubscriptionId: string,
    stripeCustomerId: string | null | undefined,
    status: string,
    periodStart: number | null | undefined,
    periodEnd: number | null | undefined,
    cancelAt: number | null | undefined,
  ): Promise<void> {
    if (!stripeSubscriptionId?.trim()) {
      return;
    }

    const subscription = await this.prisma.subscription.findFirst({
      where: { providerSubscriptionId: stripeSubscriptionId },
    });
    if (!subscription) {
      return;
    }

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status,
        ...(periodStart != null
          ? { currentPeriodStart: BigInt(periodStart) }
          : {}),
        ...(periodEnd != null ? { currentPeriodEnd: BigInt(periodEnd) } : {}),
        ...(stripeCustomerId?.trim()
          ? { providerCustomerId: stripeCustomerId }
          : {}),
        ...(cancelAt != null ? { cancelAt: BigInt(cancelAt) } : {}),
        updatedAt: BigInt(nowUnixSeconds()),
      },
    });
  }

  private defaultPeriodEnd(
    catalogPlan: SubscriptionCatalogPlan | null,
    periodStart: number,
  ): number {
    if (catalogPlan?.billingPeriod.toLowerCase() === 'yearly') {
      return periodStart + 365 * 86_400;
    }
    return periodStart + 30 * 86_400;
  }

  private async findOrCreatePlan(catalogPlan: SubscriptionCatalogPlan) {
    const activePlans = await this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
    });
    const existing = activePlans.find(
      (plan) =>
        plan.name.toLowerCase() === catalogPlan.name.toLowerCase() &&
        plan.billingPeriod.toLowerCase() ===
          catalogPlan.billingPeriod.toLowerCase(),
    );
    if (existing) {
      return existing;
    }

    const now = nowUnixSeconds();
    return this.prisma.subscriptionPlan.create({
      data: {
        name: catalogPlan.name,
        billingPeriod: catalogPlan.billingPeriod,
        priceCents: catalogPlan.priceCents,
        currency: catalogPlan.currency,
        isActive: true,
        createdAt: BigInt(now),
        updatedAt: BigInt(now),
      },
    });
  }

  private isStripeCheckoutEnabled(): boolean {
    return (
      !!this.stripeSecretKey?.trim() &&
      this.subscriptionConfig.plans.some((plan) => !!plan.stripePriceId?.trim())
    );
  }

  private toPlanDto(plan: SubscriptionCatalogPlan): PlanDto {
    return {
      name: plan.name,
      billingPeriod: plan.billingPeriod,
      priceCents: plan.priceCents,
      currency: plan.currency,
      priceDisplay: this.formatPrice(plan.priceCents, plan.currency),
      productIdIos: plan.productIdIos,
      productIdAndroid: plan.productIdAndroid,
    };
  }

  private toTierComparison(tier: SubscriptionTierLimits): TierComparisonDto {
    return {
      aiMessagesPerDay: tier.aiMessagesPerDay,
      recipeImportsPerMonth: tier.recipeImportsPerMonth,
      maxRecipes: tier.maxRecipes,
      imageUploadsPerMonth: tier.imageUploadsPerMonth,
    };
  }

  private formatPrice(priceCents: number, currency: string): string {
    const amount = priceCents / 100;
    if (currency.toUpperCase() === 'USD') {
      return `$${amount.toFixed(2)}`;
    }
    return `${amount.toFixed(2)} ${currency}`;
  }
}
