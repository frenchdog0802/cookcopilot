import { Injectable } from '@nestjs/common';

export type ToolResult = {
  toolName: string;
  data: Record<string, unknown>;
};

@Injectable()
export class ToolResultCollectorService {
  private readonly resultsByUser = new Map<string, ToolResult[]>();

  begin(userId: string): void {
    this.resultsByUser.set(userId, []);
  }

  end(userId: string): void {
    this.resultsByUser.delete(userId);
  }

  addResult(
    userId: string,
    toolName: string,
    data: Record<string, unknown>,
  ): void {
    const bag = this.resultsByUser.get(userId) ?? [];
    bag.push({ toolName, data });
    this.resultsByUser.set(userId, bag);
  }

  hasResult(userId: string): boolean {
    const results = this.resultsByUser.get(userId);
    return results != null && results.length > 0;
  }

  getResults(userId: string): ToolResult[] {
    return [...(this.resultsByUser.get(userId) ?? [])];
  }

  primaryResponseType(userId: string): string {
    return ToolResultCollectorService.primaryResponseType(
      this.getResults(userId),
    );
  }

  toAggregatedData(userId: string): Record<string, unknown> {
    return ToolResultCollectorService.toAggregatedData(this.getResults(userId));
  }

  static mapToolToResponseType(toolName: string): string {
    switch (toolName) {
      case 'createRecipe':
        return 'recipe_created';
      case 'importRecipeFromUrl':
        return 'recipe_imported';
      case 'addItemsToShoppingList':
        return 'shopping_list_updated';
      case 'addRecipeToMenu':
      case 'removeRecipeFromMenu':
      case 'updateMealPlan':
      case 'planMeals':
      case 'clearMealPlans':
        return 'meal_plan_updated';
      case 'addPantryItems':
      case 'updatePantryItem':
      case 'removePantryItem':
      case 'organizePantry':
        return 'pantry_updated';
      case 'updateRecipe':
        return 'recipe_updated';
      case 'suggestMealsFromPantry':
        return 'meal_suggestions';
      case 'updatePreferences':
        return 'preferences_updated';
      default:
        return 'action_result';
    }
  }

  static toAggregatedData(results: ToolResult[]): Record<string, unknown> {
    if (results.length === 0) {
      return {};
    }
    if (results.length === 1) {
      return results[0].data;
    }

    const actions = results.map((result) => ({
      tool: result.toolName,
      responseType: ToolResultCollectorService.mapToolToResponseType(
        result.toolName,
      ),
      ...result.data,
    }));

    return {
      actionCount: actions.length,
      actions,
    };
  }

  static primaryResponseType(results: ToolResult[]): string {
    if (results.length === 0) {
      return 'text';
    }
    if (results.length > 1) {
      return 'multi_action';
    }
    return ToolResultCollectorService.mapToolToResponseType(
      results[0].toolName,
    );
  }
}
