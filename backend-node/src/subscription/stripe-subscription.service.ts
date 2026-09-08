import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { BadRequestError } from '../common/errors/http-errors';
import { nowUnixSeconds } from '../common/time';
import type { AppConfig } from '../config/env.schema';
import type { SubscriptionCatalogPlan } from '../config/env.constants';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateCheckoutResponseDto } from './dto/subscription.dto';
import { SubscriptionService } from './subscription.service';

@Injectable()
export class StripeSubscriptionService implements OnModuleInit {
  private readonly logger = new Logger(StripeSubscriptionService.name);
  private readonly subscriptionConfig: AppConfig['subscription'];
  private readonly stripeSecretKey?: string;
  private readonly stripeWebhookSecret?: string;
  private readonly frontendUrl: string;
  private stripe: Stripe | null = null;

  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    const appConfig = configService.get<AppConfig>('app')!;
    this.subscriptionConfig = appConfig.subscription;
    this.stripeSecretKey = appConfig.optional.stripeSecretKey;
    this.stripeWebhookSecret = appConfig.optional.stripeWebhookSecret;
    this.frontendUrl = appConfig.frontendUrl;
  }

  onModuleInit(): void {
    if (this.isConfigured() && this.stripeSecretKey) {
      this.stripe = new Stripe(this.stripeSecretKey);
    }
  }

  isConfigured(): boolean {
    return (
      !!this.stripeSecretKey?.trim() &&
      this.subscriptionConfig.plans.some((plan) => !!plan.stripePriceId?.trim())
    );
  }

  async createCheckoutSession(
    userId: string,
    billingPeriod: string | undefined,
  ): Promise<CreateCheckoutResponseDto> {
    this.ensureConfigured();

    const catalogPlan = this.findCatalogPlan(billingPeriod);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestError('User not found');
    }

    const successUrl = `${this.trimTrailingSlash(this.frontendUrl)}/?subscription=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${this.trimTrailingSlash(this.frontendUrl)}/?subscription=cancelled`;

    try {
      const session = await this.stripe!.checkout.sessions.create({
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: userId,
        metadata: {
          userId,
          billingPeriod: catalogPlan.billingPeriod,
        },
        line_items: [
          {
            price: catalogPlan.stripePriceId,
            quantity: 1,
          },
        ],
        ...(user.email?.trim() ? { customer_email: user.email } : {}),
      });

      if (!session.url?.trim()) {
        throw new BadRequestError('Stripe did not return a checkout URL');
      }

      return { checkoutUrl: session.url };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown Stripe error';
      this.logger.error(
        `Stripe checkout session creation failed for user ${userId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestError(`Unable to start checkout: ${message}`);
    }
  }

  async handleWebhook(
    payload: Buffer | string,
    signatureHeader?: string,
  ): Promise<void> {
    this.ensureWebhookConfigured();

    const payloadString =
      typeof payload === 'string' ? payload : payload.toString('utf8');

    let event: Stripe.Event;
    try {
      event = this.stripe!.webhooks.constructEvent(
        payloadString,
        signatureHeader ?? '',
        this.stripeWebhookSecret!,
      );
    } catch {
      this.logger.warn('Invalid Stripe webhook signature');
      throw new BadRequestError('Invalid Stripe webhook signature');
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event);
        break;
      default:
        this.logger.debug(`Ignoring Stripe event type ${event.type}`);
    }
  }

  private async handleCheckoutCompleted(event: Stripe.Event): Promise<void> {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = this.parseUserId(
      session.client_reference_id,
      session.metadata ?? undefined,
    );
    if (!userId) {
      this.logger.warn('checkout.session.completed missing userId metadata');
      return;
    }

    const billingPeriod = session.metadata?.billingPeriod ?? null;
    let periodStart: number | null = null;
    let periodEnd: number | null = null;

    if (session.subscription) {
      const subscriptionId =
        typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription.id;
      try {
        const stripeSub =
          await this.stripe!.subscriptions.retrieve(subscriptionId);
        const period = this.getSubscriptionPeriod(stripeSub);
        periodStart = period.periodStart;
        periodEnd = period.periodEnd;
      } catch (error) {
        this.logger.warn(
          `Unable to retrieve Stripe subscription ${subscriptionId} after checkout`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    const customerId =
      typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id;
    const subscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;

    await this.subscriptionService.applyStripeSubscription(
      userId,
      customerId,
      subscriptionId,
      'active',
      billingPeriod,
      periodStart,
      periodEnd,
    );
  }

  private async handleSubscriptionUpdated(event: Stripe.Event): Promise<void> {
    const stripeSub = event.data.object as Stripe.Subscription;
    const period = this.getSubscriptionPeriod(stripeSub);
    await this.subscriptionService.applyStripeSubscriptionByProviderId(
      stripeSub.id,
      typeof stripeSub.customer === 'string'
        ? stripeSub.customer
        : stripeSub.customer?.id,
      this.mapStripeStatus(stripeSub.status),
      period.periodStart,
      period.periodEnd,
      null,
    );
  }

  private async handleSubscriptionDeleted(event: Stripe.Event): Promise<void> {
    const stripeSub = event.data.object as Stripe.Subscription;
    const period = this.getSubscriptionPeriod(stripeSub);
    await this.subscriptionService.applyStripeSubscriptionByProviderId(
      stripeSub.id,
      typeof stripeSub.customer === 'string'
        ? stripeSub.customer
        : stripeSub.customer?.id,
      'canceled',
      period.periodStart,
      period.periodEnd,
      nowUnixSeconds(),
    );
  }

  private async handlePaymentFailed(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = this.getInvoiceSubscriptionId(invoice);
    if (!subscriptionId?.trim()) {
      return;
    }

    await this.subscriptionService.applyStripeSubscriptionByProviderId(
      subscriptionId,
      typeof invoice.customer === 'string'
        ? invoice.customer
        : invoice.customer?.id,
      'past_due',
      null,
      null,
      null,
    );
  }

  private findCatalogPlan(
    billingPeriod: string | undefined,
  ): SubscriptionCatalogPlan & { stripePriceId: string } {
    if (!billingPeriod?.trim()) {
      throw new BadRequestError('billingPeriod is required');
    }

    const normalized = billingPeriod.trim().toLowerCase();
    const plan = this.subscriptionConfig.plans.find(
      (entry) => entry.billingPeriod.toLowerCase() === normalized,
    );
    if (!plan?.stripePriceId?.trim()) {
      throw new BadRequestError(`Unknown billingPeriod: ${billingPeriod}`);
    }

    return plan as SubscriptionCatalogPlan & { stripePriceId: string };
  }

  private ensureConfigured(): void {
    if (!this.isConfigured() || !this.stripe) {
      throw new BadRequestError(
        'Stripe checkout is not configured on this server',
      );
    }
  }

  private ensureWebhookConfigured(): void {
    if (!this.stripeWebhookSecret?.trim() || !this.stripe) {
      throw new BadRequestError(
        'Stripe webhook is not configured on this server',
      );
    }
  }

  private parseUserId(
    clientReferenceId: string | null | undefined,
    metadata?: Stripe.Metadata,
  ): string | null {
    if (clientReferenceId?.trim()) {
      return clientReferenceId;
    }
    const userId = metadata?.userId;
    return userId?.trim() ? userId : null;
  }

  private mapStripeStatus(stripeStatus: string): string {
    switch (stripeStatus) {
      case 'active':
      case 'trialing':
      case 'past_due':
      case 'canceled':
      case 'incomplete':
        return stripeStatus;
      default:
        return 'incomplete';
    }
  }

  private trimTrailingSlash(url: string): string {
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }

  /** Stripe Node v18: period fields moved from Subscription to SubscriptionItem. */
  private getSubscriptionPeriod(stripeSub: Stripe.Subscription): {
    periodStart: number | null;
    periodEnd: number | null;
  } {
    const item = stripeSub.items?.data?.[0];
    if (!item) {
      return { periodStart: null, periodEnd: null };
    }
    return {
      periodStart: item.current_period_start ?? null,
      periodEnd: item.current_period_end ?? null,
    };
  }

  private getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
    const parent = invoice.parent as
      | { subscription_details?: { subscription?: string | { id: string } } }
      | null
      | undefined;
    const subscription = parent?.subscription_details?.subscription;
    if (!subscription) {
      return null;
    }
    return typeof subscription === 'string' ? subscription : subscription.id;
  }
}
