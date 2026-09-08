import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Subscription } from '@prisma/client';
import { NotFoundError } from '../common/errors/http-errors';
import { nowUnixSeconds } from '../common/time';
import type { AppConfig } from '../config/env.schema';
import { PrismaService } from '../prisma/prisma.service';
import { isUnlimited, type PlanLimits } from './plan-limits';

const ACTIVE_STATUSES = ['active', 'trialing'];

@Injectable()
export class EntitlementService {
  private readonly subscriptionConfig: AppConfig['subscription'];

  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    this.subscriptionConfig = configService.get<AppConfig>('app')!.subscription;
  }

  async isPro(userId: string): Promise<boolean> {
    return (
      (await this.hasActivePaidSubscription(userId)) ||
      (await this.isWithinSignupTrial(userId))
    );
  }

  async isWithinSignupTrial(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }
    if (user.createdAt == null) {
      return false;
    }
    const trialSeconds = this.subscriptionConfig.trialDays * 86_400;
    return nowUnixSeconds() < Number(user.createdAt) + trialSeconds;
  }

  async getTrialEndsAt(userId: string): Promise<number | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.createdAt) {
      return null;
    }
    return Number(user.createdAt) + this.subscriptionConfig.trialDays * 86_400;
  }

  async getEffectiveLimits(userId: string): Promise<PlanLimits> {
    const tier = (await this.isPro(userId))
      ? this.subscriptionConfig.pro
      : this.subscriptionConfig.free;
    return {
      aiMessagesPerDay: tier.aiMessagesPerDay,
      recipeImportsPerMonth: tier.recipeImportsPerMonth,
      maxRecipes: tier.maxRecipes,
      imageUploadsPerMonth: tier.imageUploadsPerMonth,
    };
  }

  async findActiveSubscription(userId: string): Promise<Subscription | null> {
    const now = BigInt(nowUnixSeconds());
    return this.prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ACTIVE_STATUSES },
        OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gt: now } }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async hasActivePaidSubscription(userId: string): Promise<boolean> {
    return (await this.findActiveSubscription(userId)) != null;
  }
}

export { isUnlimited };
