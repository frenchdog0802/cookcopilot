/** Default listen port — avoids Spring :8080 and Expo Metro :8081. */
export const DEFAULT_PORT = 8090;

/** Minimum UTF-8 byte length for HS256 (JJWT / Nest parity). */
export const JWT_SECRET_MIN_LENGTH = 32;

/** Default access-token lifetime once Spring is sunset (seconds). */
export const DEFAULT_JWT_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 30; // 30 days

export type SubscriptionCatalogPlan = {
  name: string;
  billingPeriod: string;
  priceCents: number;
  currency: string;
  productIdIos: string;
  productIdAndroid: string;
  stripePriceId?: string;
};

export type SubscriptionTierLimits = {
  aiMessagesPerDay: number;
  recipeImportsPerMonth: number;
  maxRecipes: number;
  imageUploadsPerMonth: number;
};

export type SubscriptionConfig = {
  trialDays: number;
  free: SubscriptionTierLimits;
  pro: SubscriptionTierLimits;
  plans: SubscriptionCatalogPlan[];
};

/** Thin subscription defaults from Spring application.yml `app.subscription`. */
export const SUBSCRIPTION_DEFAULTS = {
  trialDays: 7,
  free: {
    aiMessagesPerDay: 20,
    recipeImportsPerMonth: 3,
    maxRecipes: 50,
    imageUploadsPerMonth: 10,
  },
  pro: {
    aiMessagesPerDay: 200,
    recipeImportsPerMonth: 50,
    maxRecipes: -1,
    imageUploadsPerMonth: -1,
  },
  plans: [
    {
      name: 'Pro Monthly',
      billingPeriod: 'monthly',
      priceCents: 499,
      currency: 'USD',
      productIdIos: 'com.lardermind.pro.monthly',
      productIdAndroid: 'pantry_pro_monthly',
    },
    {
      name: 'Pro Yearly',
      billingPeriod: 'yearly',
      priceCents: 3999,
      currency: 'USD',
      productIdIos: 'com.lardermind.pro.yearly',
      productIdAndroid: 'pantry_pro_yearly',
    },
  ] satisfies Omit<SubscriptionCatalogPlan, 'stripePriceId'>[],
} as const;
