export type PlanLimits = {
  aiMessagesPerDay: number;
  recipeImportsPerMonth: number;
  maxRecipes: number;
  imageUploadsPerMonth: number;
};

export function isUnlimited(limit: number): boolean {
  return limit < 0;
}
