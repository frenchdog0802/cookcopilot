import { AVAILABLE_TOOLS } from '../chat.constants';

export type ToolName = (typeof AVAILABLE_TOOLS)[number];

/** Tools that mutate user data and require HITL when enabled. */
export const MUTATING_TOOLS = new Set<string>([
  'createRecipe',
  'updateRecipe',
  'importRecipeFromUrl',
  'addRecipeToMenu',
  'planMeals',
  'updateMealPlan',
  'removeRecipeFromMenu',
  'clearMealPlans',
  'addPantryItems',
  'updatePantryItem',
  'removePantryItem',
  'organizePantry',
  'addItemsToShoppingList',
  'updatePreferences',
]);

export const READ_ONLY_TOOLS = new Set<string>([
  'listMyRecipes',
  'getRecipeDetails',
  'listMealPlans',
  'listPantry',
  'suggestMealsFromPantry',
  'getPreferences',
]);

export function isMutatingTool(toolName: string): boolean {
  return MUTATING_TOOLS.has(toolName);
}

export function requiresHitlApproval(
  toolNames: string[],
  hitlEnabled: boolean,
): boolean {
  if (!hitlEnabled) {
    return false;
  }
  return toolNames.some((name) => isMutatingTool(name));
}

export function summarizeToolArgs(args: unknown): string {
  try {
    const json = JSON.stringify(args ?? {});
    if (json.length <= 160) {
      return json;
    }
    return `${json.slice(0, 157)}...`;
  } catch {
    return '{}';
  }
}
