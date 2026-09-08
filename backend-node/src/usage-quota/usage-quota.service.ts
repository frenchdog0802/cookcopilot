import { Injectable } from '@nestjs/common';
import type { UsageQuota } from '@prisma/client';
import { QuotaExceededError } from '../common/errors/http-errors';
import { nowUnixSeconds, startOfUtcDay, startOfUtcMonth } from '../common/time';
import { EntitlementService } from '../entitlement/entitlement.service';
import { isUnlimited, type PlanLimits } from '../entitlement/plan-limits';
import { PrismaService } from '../prisma/prisma.service';
import type { UsageSummaryDto } from '../subscription/dto/subscription.dto';

export const QUOTA_AI_MESSAGES = 'ai_messages';
export const QUOTA_RECIPE_IMPORTS = 'recipe_imports';
export const QUOTA_RECIPES = 'recipes';
export const QUOTA_IMAGE_UPLOADS = 'image_uploads';

@Injectable()
export class UsageQuotaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlementService: EntitlementService,
  ) {}

  async getEffectiveLimits(userId: string): Promise<PlanLimits> {
    return this.entitlementService.getEffectiveLimits(userId);
  }

  async getUsageSummary(userId: string): Promise<UsageSummaryDto> {
    const limits = await this.getEffectiveLimits(userId);
    const quota = await this.getOrCreateQuota(userId);
    await this.resetPeriodsIfNeeded(quota);

    const recipeCount = await this.prisma.recipe.count({ where: { userId } });

    return {
      aiMessagesUsed: quota.aiMessageSent,
      aiMessagesLimit: limits.aiMessagesPerDay,
      recipeImportsUsed: quota.recipesImported,
      recipeImportsLimit: limits.recipeImportsPerMonth,
      recipeCount,
      recipeLimit: limits.maxRecipes,
      imageUploadsUsed: quota.imagesUploaded,
      imageUploadsLimit: limits.imageUploadsPerMonth,
    };
  }

  async checkAndIncrementAiMessage(userId: string): Promise<void> {
    const limits = await this.getEffectiveLimits(userId);
    if (isUnlimited(limits.aiMessagesPerDay)) {
      return;
    }

    const quota = await this.getOrCreateQuota(userId);
    await this.resetPeriodsIfNeeded(quota);

    if (quota.aiMessageSent >= limits.aiMessagesPerDay) {
      throw new QuotaExceededError(
        QUOTA_AI_MESSAGES,
        "You've reached your daily AI message limit. Upgrade to Pro for more.",
      );
    }

    await this.prisma.usageQuota.update({
      where: { id: quota.id },
      data: {
        aiMessageSent: quota.aiMessageSent + 1,
        updatedAt: BigInt(nowUnixSeconds()),
      },
    });
  }

  async checkRecipeCreation(userId: string): Promise<void> {
    const limits = await this.getEffectiveLimits(userId);
    if (isUnlimited(limits.maxRecipes)) {
      return;
    }

    const recipeCount = await this.prisma.recipe.count({ where: { userId } });
    if (recipeCount >= limits.maxRecipes) {
      throw new QuotaExceededError(
        QUOTA_RECIPES,
        `You've reached your recipe limit (${limits.maxRecipes}). Upgrade to Pro for unlimited recipes.`,
      );
    }
  }

  async checkAndIncrementRecipeImport(userId: string): Promise<void> {
    await this.checkRecipeCreation(userId);

    const limits = await this.getEffectiveLimits(userId);
    if (isUnlimited(limits.recipeImportsPerMonth)) {
      return;
    }

    const quota = await this.getOrCreateQuota(userId);
    await this.resetPeriodsIfNeeded(quota);

    if (quota.recipesImported >= limits.recipeImportsPerMonth) {
      throw new QuotaExceededError(
        QUOTA_RECIPE_IMPORTS,
        "You've reached your monthly recipe import limit. Upgrade to Pro for more.",
      );
    }

    await this.prisma.usageQuota.update({
      where: { id: quota.id },
      data: {
        recipesImported: quota.recipesImported + 1,
        updatedAt: BigInt(nowUnixSeconds()),
      },
    });
  }

  async checkAndIncrementImageUpload(userId: string): Promise<void> {
    const limits = await this.getEffectiveLimits(userId);
    if (isUnlimited(limits.imageUploadsPerMonth)) {
      return;
    }

    const quota = await this.getOrCreateQuota(userId);
    await this.resetPeriodsIfNeeded(quota);

    if (quota.imagesUploaded >= limits.imageUploadsPerMonth) {
      throw new QuotaExceededError(
        QUOTA_IMAGE_UPLOADS,
        "You've reached your monthly image upload limit. Upgrade to Pro for unlimited uploads.",
      );
    }

    await this.prisma.usageQuota.update({
      where: { id: quota.id },
      data: {
        imagesUploaded: quota.imagesUploaded + 1,
        updatedAt: BigInt(nowUnixSeconds()),
      },
    });
  }

  private async getOrCreateQuota(userId: string): Promise<UsageQuota> {
    const existing = await this.prisma.usageQuota.findUnique({
      where: { userId },
    });
    if (existing) {
      return existing;
    }

    const now = nowUnixSeconds();
    return this.prisma.usageQuota.create({
      data: {
        userId,
        periodPlan: 'monthly',
        periodStart: BigInt(now),
        periodEnd: BigInt(now),
        aiMessageSent: 0,
        recipesCreated: 0,
        recipesImported: 0,
        imagesUploaded: 0,
        aiPeriodStart: BigInt(startOfUtcDay(now)),
        monthlyPeriodStart: BigInt(startOfUtcMonth(now)),
        createdAt: BigInt(now),
        updatedAt: BigInt(now),
      },
    });
  }

  private async resetPeriodsIfNeeded(quota: UsageQuota): Promise<void> {
    const now = nowUnixSeconds();
    const dayStart = startOfUtcDay(now);
    const monthStart = startOfUtcMonth(now);
    const updates: Partial<{
      aiPeriodStart: bigint;
      aiMessageSent: number;
      monthlyPeriodStart: bigint;
      recipesImported: number;
      imagesUploaded: number;
      updatedAt: bigint;
    }> = {};

    if (quota.aiPeriodStart == null || Number(quota.aiPeriodStart) < dayStart) {
      updates.aiPeriodStart = BigInt(dayStart);
      updates.aiMessageSent = 0;
    }

    if (
      quota.monthlyPeriodStart == null ||
      Number(quota.monthlyPeriodStart) < monthStart
    ) {
      updates.monthlyPeriodStart = BigInt(monthStart);
      updates.recipesImported = 0;
      updates.imagesUploaded = 0;
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = BigInt(now);
      await this.prisma.usageQuota.update({
        where: { id: quota.id },
        data: updates,
      });
      Object.assign(quota, updates);
    }
  }
}
