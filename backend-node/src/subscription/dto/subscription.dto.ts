import { IsOptional, IsString } from 'class-validator';

export type UsageSummaryDto = {
  aiMessagesUsed: number;
  aiMessagesLimit: number;
  recipeImportsUsed: number;
  recipeImportsLimit: number;
  recipeCount: number;
  recipeLimit: number;
  imageUploadsUsed: number;
  imageUploadsLimit: number;
};

export type SubscriptionStatusDto = {
  isPro: boolean;
  isTrial: boolean;
  trialEndsAt: number | null;
  expiresAt: number | null;
  productId?: string | null;
  planName: string | null;
  usage: UsageSummaryDto;
};

export type PlanDto = {
  name: string;
  billingPeriod: string;
  priceCents: number;
  currency: string;
  priceDisplay: string;
  productIdIos: string;
  productIdAndroid: string;
};

export type TierComparisonDto = {
  aiMessagesPerDay: number;
  recipeImportsPerMonth: number;
  maxRecipes: number;
  imageUploadsPerMonth: number;
};

export type GetPlansResponse = {
  plans: PlanDto[];
  free: TierComparisonDto;
  pro: TierComparisonDto;
  trialDays: number;
  stripeCheckoutEnabled: boolean;
};

export class SyncPurchaseRequestDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  platform?: string;
}

export type SyncPurchaseResponseDto = {
  success: boolean;
  status: SubscriptionStatusDto;
};

export class ValidateReceiptRequestDto {
  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsString()
  receipt?: string;

  @IsOptional()
  @IsString()
  productId?: string;
}

export type ValidateReceiptResponseDto = {
  valid: boolean;
  expiresAt: number | null;
  productId: string;
};

export class CreateCheckoutRequestDto {
  @IsOptional()
  @IsString()
  billingPeriod?: string;
}

export type CreateCheckoutResponseDto = {
  checkoutUrl: string;
};
