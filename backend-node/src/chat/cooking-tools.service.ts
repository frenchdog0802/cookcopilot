import { Injectable, Logger } from '@nestjs/common';
import { DynamicStructuredTool } from '@langchain/core/tools';
import type { StructuredToolInterface } from '@langchain/core/tools';
import { z } from 'zod';
import { QuotaExceededError } from '../common/errors/http-errors';
import { nowUnixSeconds } from '../common/time';
import { FoldersService } from '../folders/folders.service';
import { MealPlansService } from '../meal-plans/meal-plans.service';
import { PantryItemsService } from '../pantry-items/pantry-items.service';
import { PrismaService } from '../prisma/prisma.service';
import { RecipesService } from '../recipes/recipes.service';
import { ShoppingListService } from '../shopping-list/shopping-list.service';
import { UserPreferencesService } from '../user-preferences/user-preferences.service';
import { MAX_RECIPE_STEPS, MAX_TOOL_LIST_SIZE } from './chat-limits';
import { ToolResultCollectorService } from './tool-result-collector.service';
import type { MealPlanDto } from '../meal-plans/dto/meal-plan.dto';
import { UsageQuotaService } from '../usage-quota/usage-quota.service';

const DEFAULT_MEAL_TYPE = 'dinner';

const ingredientInputSchema = z.object({
  name: z.string(),
  quantity: z.string().optional(),
  unit: z.string().optional(),
  note: z.string().optional(),
});

const shoppingItemSchema = z.object({
  name: z.string(),
  quantity: z.string().optional(),
  unit: z.string().optional(),
});

const pantryItemSchema = z.object({
  name: z.string(),
  quantity: z.string().optional(),
  unit: z.string().optional(),
  notes: z.string().optional(),
});

const mealPlanEntrySchema = z.object({
  recipeId: z.string().optional(),
  recipeName: z.string().optional(),
  servingDate: z.string(),
  mealType: z.string().optional(),
});

@Injectable()
export class CookingToolsService {
  private readonly logger = new Logger(CookingToolsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly recipesService: RecipesService,
    private readonly mealPlansService: MealPlansService,
    private readonly pantryItemsService: PantryItemsService,
    private readonly shoppingListService: ShoppingListService,
    private readonly foldersService: FoldersService,
    private readonly userPreferencesService: UserPreferencesService,
    private readonly toolResultCollector: ToolResultCollectorService,
    private readonly usageQuotaService: UsageQuotaService,
  ) {}

  buildTools(userId: string): StructuredToolInterface[] {
    return [
      this.tool(
        'getPreferences',
        "Get the user's food preferences: allergies, dislikes, likes, dietary restrictions, and household notes. Call this before suggesting or planning meals.",
        z.object({}),
        async () => this.getPreferences(userId),
      ),
      this.tool(
        'updatePreferences',
        `Update the user's food preferences. Only pass fields you want to change; omit fields to leave them unchanged.
CRITICAL: Only save what the user explicitly said. Never invent allergies, disliked ingredients, or likes.
allergies/dislikes/likes/dietaryRestrictions replace the whole list when provided (pass an empty list to clear).
householdNotes captures family member preferences. measurementUnit is metric or imperial.`,
        z.object({
          allergies: z.array(z.string()).optional(),
          dislikes: z.array(z.string()).optional(),
          likes: z.array(z.string()).optional(),
          dietaryRestrictions: z.array(z.string()).optional(),
          householdNotes: z.string().optional(),
          measurementUnit: z.string().optional(),
          notes: z.string().optional(),
        }),
        async (input) => this.updatePreferences(userId, input),
      ),
      this.tool(
        'listMyRecipes',
        'List all recipes belonging to the current user',
        z.object({}),
        async () => this.listMyRecipes(userId),
      ),
      this.tool(
        'getRecipeDetails',
        'Get full details of a recipe by ID including ingredients and steps',
        z.object({ recipeId: z.string() }),
        async ({ recipeId }) => this.getRecipeDetails(userId, recipeId),
      ),
      this.tool(
        'createRecipe',
        'Create a new recipe for the current user. Create ONE recipe per call. Pass at most 8 ingredients and 12 steps.',
        z.object({
          name: z.string(),
          description: z.string().optional(),
          ingredients: z.array(ingredientInputSchema).optional(),
          steps: z.array(z.string()).optional(),
        }),
        async (input) => this.createRecipe(userId, input),
      ),
      this.tool(
        'updateRecipe',
        "Update an existing recipe's name, description, ingredients, or steps",
        z.object({
          recipeId: z.string(),
          name: z.string().optional(),
          description: z.string().optional(),
          ingredients: z.array(ingredientInputSchema).optional(),
          steps: z.array(z.string()).optional(),
        }),
        async (input) => this.updateRecipe(userId, input),
      ),
      this.tool(
        'importRecipeFromUrl',
        'Import a recipe from a web URL and save it for the current user',
        z.object({ url: z.string() }),
        ({ url }) => this.importRecipeFromUrl(userId, url),
      ),
      this.tool(
        'listMealPlans',
        'List meal plans for the user, optionally filtered by date range (YYYY-MM-DD).',
        z.object({
          fromDate: z.string().optional(),
          toDate: z.string().optional(),
        }),
        async (input) =>
          this.listMealPlans(userId, input.fromDate, input.toDate),
      ),
      this.tool(
        'addRecipeToMenu',
        "Add one of the user's recipes to their meal menu on a specific date",
        z.object({
          recipeId: z.string(),
          servingDate: z.string(),
          mealType: z.string().optional(),
        }),
        async (input) => this.addRecipeToMenu(userId, input),
      ),
      this.tool(
        'planMeals',
        'Schedule multiple meals at once. Pass at most 8 meals per call; call again for more.',
        z.object({
          meals: z.array(mealPlanEntrySchema),
        }),
        async ({ meals }) => this.planMeals(userId, meals),
      ),
      this.tool(
        'updateMealPlan',
        "Update an existing meal plan's date, meal type, or recipe",
        z.object({
          mealPlanId: z.string(),
          servingDate: z.string().optional(),
          mealType: z.string().optional(),
          recipeId: z.string().optional(),
        }),
        async (input) => this.updateMealPlan(userId, input),
      ),
      this.tool(
        'removeRecipeFromMenu',
        "Remove a recipe from the user's meal menu by meal plan ID",
        z.object({ mealPlanId: z.string() }),
        async ({ mealPlanId }) => this.removeRecipeFromMenu(userId, mealPlanId),
      ),
      this.tool(
        'clearMealPlans',
        'Clear many meal plans in one call by optional date range (YYYY-MM-DD).',
        z.object({
          fromDate: z.string().optional(),
          toDate: z.string().optional(),
        }),
        async (input) =>
          this.clearMealPlans(userId, input.fromDate, input.toDate),
      ),
      this.tool(
        'listPantry',
        "List all items in the user's pantry inventory",
        z.object({}),
        async () => this.listPantry(userId),
      ),
      this.tool(
        'addPantryItems',
        "Add items to the user's pantry inventory. Pass at most 8 items per call; call again for more.",
        z.object({ items: z.array(pantryItemSchema) }),
        async ({ items }) => this.addPantryItems(userId, items),
      ),
      this.tool(
        'updatePantryItem',
        "Update a pantry item's quantity, unit, or notes",
        z.object({
          pantryItemId: z.string(),
          quantity: z.string().optional(),
          unit: z.string().optional(),
          notes: z.string().optional(),
        }),
        async (input) => this.updatePantryItem(userId, input),
      ),
      this.tool(
        'removePantryItem',
        "Remove an item from the user's pantry",
        z.object({ pantryItemId: z.string() }),
        async ({ pantryItemId }) => this.removePantryItem(userId, pantryItemId),
      ),
      this.tool(
        'organizePantry',
        'Organize pantry by merging duplicate ingredients and normalizing entries',
        z.object({}),
        async () => this.organizePantry(userId),
      ),
      this.tool(
        'addItemsToShoppingList',
        "Add items to the user's shopping list. Pass at most 8 items per call; call again for more.",
        z.object({ items: z.array(shoppingItemSchema) }),
        async ({ items }) => this.addItemsToShoppingList(userId, items),
      ),
      this.tool(
        'suggestMealsFromPantry',
        'Score saved recipes against pantry ingredients and return the best matches. Call this before inventing a menu when the user asks to plan or suggest meals from what they have.',
        z.object({
          scheduleTopMatches: z.boolean().optional(),
          maxSuggestions: z.number().optional(),
        }),
        async (input) => this.suggestMealsFromPantry(userId, input),
      ),
    ];
  }

  private tool<T extends z.ZodTypeAny>(
    name: string,
    description: string,
    schema: T,
    func: (input: z.infer<T>) => Promise<string> | string,
  ): StructuredToolInterface {
    return new DynamicStructuredTool({
      name,
      description,
      schema,
      func: async (input) => func(input as z.infer<T>),
    });
  }

  private async getPreferences(userId: string): Promise<string> {
    const prefs = await this.userPreferencesService.getPreferences(userId);
    return this.summarizePreferences(prefs);
  }

  private async updatePreferences(
    userId: string,
    input: {
      allergies?: string[];
      dislikes?: string[];
      likes?: string[];
      dietaryRestrictions?: string[];
      householdNotes?: string;
      measurementUnit?: string;
      notes?: string;
    },
  ): Promise<string> {
    const prefs = await this.userPreferencesService.updatePreferences(userId, {
      allergies: input.allergies,
      dislikes: input.dislikes,
      likes: input.likes,
      dietaryRestrictions: input.dietaryRestrictions,
      householdNotes: input.householdNotes,
      measurementUnit: input.measurementUnit,
      notes: input.notes,
    });

    const data: Record<string, unknown> = {
      id: prefs.id,
      householdNotes: prefs.householdNotes,
      measurementUnit: prefs.measurementUnit,
      notes: prefs.notes,
      allergies: prefs.allergies,
      dislikes: prefs.dislikes,
      likes: prefs.likes,
      dietaryRestrictions: prefs.dietaryRestrictions,
      message: 'Updated user preferences.',
    };
    this.toolResultCollector.addResult(userId, 'updatePreferences', data);
    return `Preferences updated. ${this.summarizePreferences(prefs)}`;
  }

  private async listMyRecipes(userId: string): Promise<string> {
    const recipes = await this.prisma.recipe.findMany({
      where: { userId },
      orderBy: { mealName: 'asc' },
    });
    if (recipes.length === 0) {
      return 'You have no saved recipes yet.';
    }
    return recipes
      .map((recipe) => `${recipe.mealName} (id: ${recipe.id})`)
      .join(', ');
  }

  private async getRecipeDetails(
    userId: string,
    recipeId: string,
  ): Promise<string> {
    const parsedRecipeId = this.parseUuid(recipeId);
    if (!parsedRecipeId) {
      return 'Invalid recipe ID format.';
    }

    const recipe = await this.prisma.recipe.findFirst({
      where: { id: parsedRecipeId, userId },
      include: {
        ingredients: { include: { ingredient: true } },
        steps: { orderBy: { stepNo: 'asc' } },
      },
    });
    if (!recipe) {
      return 'Recipe not found or does not belong to you.';
    }

    const ingredients = recipe.ingredients.map((row) =>
      `${row.ingredient.name}: ${row.quantity} ${row.unit ?? ''}`.trim(),
    );
    const steps = recipe.steps.map((step) => step.instruction);
    return `Recipe: ${recipe.mealName} | ingredients: ${ingredients.join(', ')} | instructions: ${steps.join('; ')}`;
  }

  private async createRecipe(
    userId: string,
    input: {
      name: string;
      description?: string;
      ingredients?: Array<{
        name: string;
        quantity?: string;
        unit?: string;
        note?: string;
      }>;
      steps?: string[];
    },
  ): Promise<string> {
    const ingredients = input.ingredients ?? [];
    const steps = input.steps ?? [];

    if (ingredients.length > MAX_TOOL_LIST_SIZE) {
      return `Too many ingredients. Maximum is ${MAX_TOOL_LIST_SIZE}.`;
    }
    if (steps.length > MAX_RECIPE_STEPS) {
      return `Too many steps. Maximum is ${MAX_RECIPE_STEPS}. Create the recipe with fewer steps, or split into another recipe.`;
    }

    try {
      await this.usageQuotaService.checkRecipeCreation(userId);
    } catch (error) {
      if (error instanceof QuotaExceededError) {
        return error.message;
      }
      throw error;
    }

    const folder = await this.getOrCreateUncategorized(userId);
    const now = BigInt(nowUnixSeconds());
    const instructions = steps.length > 0 ? steps.join('\n') : null;

    const recipe = await this.prisma.recipe.create({
      data: {
        userId,
        folderId: folder.id,
        mealName: input.name,
        description: input.description ?? null,
        instructions,
        createdAt: now,
        updatedAt: now,
      },
    });

    const ingredientCount = await this.saveRecipeIngredients(
      recipe.id,
      ingredients,
      now,
    );

    if (steps.length > 0) {
      await this.prisma.step.createMany({
        data: steps.map((instruction, index) => ({
          recipeId: recipe.id,
          stepNo: index + 1,
          instruction,
          createdAt: now,
          updatedAt: now,
        })),
      });
    }

    const data = this.recipeCreatedData(recipe, ingredientCount, steps);
    this.toolResultCollector.addResult(userId, 'createRecipe', data);
    return `Created recipe "${recipe.mealName}" with ${ingredientCount} ingredients.`;
  }

  private async updateRecipe(
    userId: string,
    input: {
      recipeId: string;
      name?: string;
      description?: string;
      ingredients?: Array<{
        name: string;
        quantity?: string;
        unit?: string;
        note?: string;
      }>;
      steps?: string[];
    },
  ): Promise<string> {
    const parsedRecipeId = this.parseUuid(input.recipeId);
    if (!parsedRecipeId) {
      return 'Invalid recipe ID format.';
    }

    const existing = await this.prisma.recipe.findFirst({
      where: { id: parsedRecipeId, userId },
    });
    if (!existing) {
      return 'Recipe not found or does not belong to you.';
    }

    const steps = input.steps ?? [];
    const instructions =
      steps.length > 0 ? steps.join('\n') : (input.description ?? undefined);

    const updated = await this.recipesService.updateRecipe(
      userId,
      parsedRecipeId,
      {
        meal_name: input.name,
        description: input.description,
        instructions,
        ingredients: input.ingredients?.map((row) => ({
          name: row.name,
          quantity: this.parseQuantity(row.quantity),
          unit: row.unit,
          note: row.note,
        })),
      },
    );

    const data: Record<string, unknown> = {
      recipeId: updated.id,
      recipeName: updated.meal_name,
      message: `Updated recipe "${updated.meal_name}"`,
    };
    this.toolResultCollector.addResult(userId, 'updateRecipe', data);
    return String(data.message);
  }

  private importRecipeFromUrl(_userId: string, url: string): string {
    this.logger.warn(`importRecipeFromUrl not yet implemented url=${url}`);
    return 'Recipe import from URL is not yet available in this environment.';
  }

  private async listMealPlans(
    userId: string,
    fromDate?: string,
    toDate?: string,
  ): Promise<string> {
    const plans = await this.mealPlansService.listMealPlans(userId);
    const filtered = plans
      .filter((plan) =>
        this.withinDateRange(plan.serving_date ?? '', fromDate, toDate),
      )
      .sort((a, b) => {
        const byDate = (a.serving_date ?? '').localeCompare(
          b.serving_date ?? '',
        );
        if (byDate !== 0) {
          return byDate;
        }
        return (a.meal_type ?? '').localeCompare(b.meal_type ?? '');
      });

    if (filtered.length === 0) {
      return `No meal plans scheduled${fromDate || toDate ? ' in that date range.' : '.'}`;
    }

    return filtered
      .map(
        (plan) =>
          `${plan.serving_date} ${plan.meal_type}: ${plan.meal_name} (planId: ${plan.id}, recipeId: ${plan.recipe_id})`,
      )
      .join('\n');
  }

  private async addRecipeToMenu(
    userId: string,
    input: { recipeId: string; servingDate: string; mealType?: string },
  ): Promise<string> {
    const parsedRecipeId = this.parseUuid(input.recipeId);
    if (!parsedRecipeId) {
      return 'Invalid recipe ID format.';
    }

    const recipe = await this.prisma.recipe.findFirst({
      where: { id: parsedRecipeId, userId },
    });
    if (!recipe) {
      return 'Recipe not found or does not belong to you.';
    }

    const resolvedDate = this.resolveServingDate(input.servingDate);
    if (!resolvedDate) {
      return 'Invalid serving date. Use YYYY-MM-DD format.';
    }

    const mealType =
      input.mealType && input.mealType.trim().length > 0
        ? input.mealType
        : DEFAULT_MEAL_TYPE;

    const created = await this.mealPlansService.createMealPlan(userId, {
      recipe_id: parsedRecipeId,
      meal_type: mealType,
      serving_date: resolvedDate,
    });

    const data = this.mealPlanData(
      created.mealPlan,
      `Added "${created.mealPlan.meal_name}" to ${mealType} on ${resolvedDate}`,
    );
    this.toolResultCollector.addResult(userId, 'addRecipeToMenu', data);
    return String(data.message);
  }

  private async planMeals(
    userId: string,
    meals: Array<{
      recipeId?: string;
      recipeName?: string;
      servingDate: string;
      mealType?: string;
    }>,
  ): Promise<string> {
    if (!meals || meals.length === 0) {
      return 'No meals provided.';
    }
    if (meals.length > MAX_TOOL_LIST_SIZE) {
      return `Too many meals. Maximum is ${MAX_TOOL_LIST_SIZE}.`;
    }

    const scheduled: Array<Record<string, unknown>> = [];
    const skipped: string[] = [];

    for (const entry of meals) {
      const recipeId = await this.resolveRecipeReference(
        userId,
        entry.recipeId,
        entry.recipeName,
      );
      if (!recipeId) {
        skipped.push(
          `recipe not found id=${entry.recipeId ?? ''} name=${entry.recipeName ?? ''}`,
        );
        continue;
      }

      const servingDate = this.resolveServingDate(entry.servingDate);
      if (!servingDate) {
        skipped.push(
          `invalid date=${entry.servingDate} for recipeId=${recipeId}`,
        );
        continue;
      }

      const mealType =
        entry.mealType && entry.mealType.trim().length > 0
          ? entry.mealType
          : DEFAULT_MEAL_TYPE;

      const created = await this.mealPlansService.createMealPlan(userId, {
        recipe_id: recipeId,
        meal_type: mealType,
        serving_date: servingDate,
      });
      scheduled.push(created.mealPlan);
    }

    if (scheduled.length === 0) {
      const detail =
        skipped.length > 0 ? ` Skipped: ${skipped.join('; ')}` : '';
      return `Could not schedule any meals. Check recipe IDs/names and dates.${detail}`;
    }

    const message =
      `Scheduled ${scheduled.length}/${meals.length} meal(s): ` +
      scheduled
        .map(
          (meal) =>
            `${String(meal.serving_date)} ${String(meal.meal_type)}=${String(meal.meal_name)}`,
        )
        .join('; ') +
      (skipped.length > 0
        ? ` Skipped ${skipped.length}: ${skipped.join('; ')}`
        : '');

    const data: Record<string, unknown> = {
      mealsScheduled: scheduled.length,
      meals: scheduled,
      message,
    };
    this.toolResultCollector.addResult(userId, 'planMeals', data);
    return message;
  }

  private async updateMealPlan(
    userId: string,
    input: {
      mealPlanId: string;
      servingDate?: string;
      mealType?: string;
      recipeId?: string;
    },
  ): Promise<string> {
    const parsedMealPlanId = this.parseUuid(input.mealPlanId);
    if (!parsedMealPlanId) {
      return 'Invalid meal plan ID format.';
    }

    const existing = await this.prisma.mealPlan.findFirst({
      where: { id: parsedMealPlanId, userId },
    });
    if (!existing) {
      return 'Meal plan not found.';
    }

    let servingDate = existing.servingDate ?? undefined;
    if (input.servingDate && input.servingDate.trim().length > 0) {
      const resolved = this.resolveServingDate(input.servingDate);
      if (!resolved) {
        return 'Invalid serving date. Use YYYY-MM-DD format.';
      }
      servingDate = resolved;
    }

    if (input.recipeId && input.recipeId.trim().length > 0) {
      const parsedRecipeId = this.parseUuid(input.recipeId);
      if (!parsedRecipeId) {
        return 'Invalid recipe ID format.';
      }
      const recipe = await this.prisma.recipe.findFirst({
        where: { id: parsedRecipeId, userId },
      });
      if (!recipe) {
        return 'Recipe not found or does not belong to you.';
      }
    }

    const updated = await this.mealPlansService.updateMealPlan(
      userId,
      parsedMealPlanId,
      {
        serving_date: servingDate,
        meal_type: input.mealType,
        recipe_id: input.recipeId,
      },
    );

    const data: Record<string, unknown> = {
      mealPlanId: updated.id,
      recipeName: updated.meal_name,
      mealType: updated.meal_type,
      servingDate: updated.serving_date,
      message: `Updated meal plan for "${updated.meal_name}".`,
    };
    this.toolResultCollector.addResult(userId, 'updateMealPlan', data);
    return 'Meal plan updated.';
  }

  private async removeRecipeFromMenu(
    userId: string,
    mealPlanId: string,
  ): Promise<string> {
    const parsedMealPlanId = this.parseUuid(mealPlanId);
    if (!parsedMealPlanId) {
      return 'Invalid meal plan ID format.';
    }

    const existing = await this.prisma.mealPlan.findFirst({
      where: { id: parsedMealPlanId, userId },
    });
    if (!existing) {
      return 'Meal plan not found.';
    }

    await this.mealPlansService.deleteMealPlan(userId, parsedMealPlanId);
    const data = {
      message: 'Recipe removed from menu',
      mealPlanId: parsedMealPlanId,
    };
    this.toolResultCollector.addResult(userId, 'removeRecipeFromMenu', data);
    return data.message;
  }

  private async clearMealPlans(
    userId: string,
    fromDate?: string,
    toDate?: string,
  ): Promise<string> {
    const from = this.resolveOptionalDate(fromDate);
    if (fromDate && fromDate.trim().length > 0 && !from) {
      return 'Invalid fromDate. Use YYYY-MM-DD format.';
    }
    const to = this.resolveOptionalDate(toDate);
    if (toDate && toDate.trim().length > 0 && !to) {
      return 'Invalid toDate. Use YYYY-MM-DD format.';
    }

    const plans = await this.prisma.mealPlan.findMany({ where: { userId } });
    const toDelete = plans.filter((plan) =>
      this.withinDateRange(
        plan.servingDate ?? '',
        from ?? undefined,
        to ?? undefined,
      ),
    );

    if (toDelete.length === 0) {
      return `No meal plans found to clear${from || to ? ' in that date range.' : '.'}`;
    }

    await this.prisma.mealPlan.deleteMany({
      where: { id: { in: toDelete.map((plan) => plan.id) } },
    });

    const message =
      `Cleared ${toDelete.length} meal plan(s)` +
      (from || to ? ` from ${from ?? '…'} to ${to ?? '…'}` : '') +
      '.';

    const data: Record<string, unknown> = {
      removedCount: toDelete.length,
      fromDate: from,
      toDate: to,
      message,
    };
    this.toolResultCollector.addResult(userId, 'clearMealPlans', data);
    return message;
  }

  private async listPantry(userId: string): Promise<string> {
    const items = await this.prisma.pantryItem.findMany({
      where: { userId },
      include: { ingredient: true },
    });
    if (items.length === 0) {
      return 'Pantry is empty.';
    }
    return items
      .map((item) =>
        `${item.ingredient.name}: ${item.quantity} ${item.unit ?? ''} (id: ${item.id})`.trim(),
      )
      .join(', ');
  }

  private async addPantryItems(
    userId: string,
    items: Array<{
      name: string;
      quantity?: string;
      unit?: string;
      notes?: string;
    }>,
  ): Promise<string> {
    if (!items || items.length === 0) {
      return 'No items provided.';
    }
    if (items.length > MAX_TOOL_LIST_SIZE) {
      return `Too many items. Maximum is ${MAX_TOOL_LIST_SIZE}.`;
    }

    const saved = await this.insertAllPantryItems(userId, items);
    const addedNames: string[] = [];
    const mergedNames: string[] = [];
    for (const row of saved) {
      const name =
        typeof row.name === 'string' && row.name.length > 0 ? row.name : 'item';
      if (row.merged) {
        mergedNames.push(name);
      } else {
        addedNames.push(name);
      }
    }

    const message = this.formatAddResult('pantry', addedNames, mergedNames);
    const data: Record<string, unknown> = {
      itemsAdded: saved.length,
      items: saved,
      message,
    };
    this.toolResultCollector.addResult(userId, 'addPantryItems', data);
    return message;
  }

  private async updatePantryItem(
    userId: string,
    input: {
      pantryItemId: string;
      quantity?: string;
      unit?: string;
      notes?: string;
    },
  ): Promise<string> {
    const parsedId = this.parseUuid(input.pantryItemId);
    if (!parsedId) {
      return 'Invalid pantry item ID format.';
    }

    const existing = await this.prisma.pantryItem.findFirst({
      where: { id: parsedId, userId },
      include: { ingredient: true },
    });
    if (!existing) {
      return 'Pantry item not found.';
    }

    const updated = await this.pantryItemsService.updateItem(userId, parsedId, {
      quantity:
        input.quantity && input.quantity.trim().length > 0
          ? this.parseQuantity(input.quantity)
          : undefined,
      unit: input.unit,
      notes: input.notes,
    });

    const data: Record<string, unknown> = {
      pantryItemId: updated.id,
      name: existing.ingredient.name,
      quantity: updated.quantity,
      unit: updated.unit,
      message: 'Updated pantry item.',
    };
    this.toolResultCollector.addResult(userId, 'updatePantryItem', data);
    return String(data.message);
  }

  private async removePantryItem(
    userId: string,
    pantryItemId: string,
  ): Promise<string> {
    const parsedId = this.parseUuid(pantryItemId);
    if (!parsedId) {
      return 'Invalid pantry item ID format.';
    }

    const existing = await this.prisma.pantryItem.findFirst({
      where: { id: parsedId, userId },
    });
    if (!existing) {
      return 'Pantry item not found.';
    }

    await this.pantryItemsService.deleteItem(userId, parsedId);
    const data = {
      message: 'Removed pantry item.',
      pantryItemId: parsedId,
    };
    this.toolResultCollector.addResult(userId, 'removePantryItem', data);
    return data.message;
  }

  private async organizePantry(userId: string): Promise<string> {
    const items = await this.prisma.pantryItem.findMany({
      where: { userId },
      include: { ingredient: true },
    });
    if (items.length === 0) {
      return 'Pantry is already empty.';
    }

    const grouped = new Map<string, typeof items>();
    for (const item of items) {
      const key = item.ingredient.name.toLowerCase();
      const group = grouped.get(key) ?? [];
      group.push(item);
      grouped.set(key, group);
    }

    let merged = 0;
    let removed = 0;
    for (const group of grouped.values()) {
      if (group.length <= 1) {
        continue;
      }
      const keeper = group[0];
      const totalQty = group.reduce((sum, row) => sum + (row.quantity ?? 0), 0);
      await this.prisma.pantryItem.update({
        where: { id: keeper.id },
        data: {
          quantity: totalQty,
          updatedAt: BigInt(nowUnixSeconds()),
        },
      });
      merged += 1;
      for (let i = 1; i < group.length; i++) {
        await this.prisma.pantryItem.delete({ where: { id: group[i].id } });
        removed += 1;
      }
    }

    const message = `Organized pantry: merged ${merged} duplicate group(s), removed ${removed} duplicate item(s).`;
    const data: Record<string, unknown> = {
      mergedGroups: merged,
      removedDuplicates: removed,
      message,
    };
    this.toolResultCollector.addResult(userId, 'organizePantry', data);
    return message;
  }

  private async addItemsToShoppingList(
    userId: string,
    items: Array<{ name: string; quantity?: string; unit?: string }>,
  ): Promise<string> {
    if (!items || items.length === 0) {
      return 'No items provided.';
    }
    if (items.length > MAX_TOOL_LIST_SIZE) {
      return `Too many items. Maximum is ${MAX_TOOL_LIST_SIZE}.`;
    }

    const saved = await this.insertAllShoppingListItems(userId, items);
    const addedNames: string[] = [];
    const mergedNames: string[] = [];
    for (const row of saved) {
      const name =
        typeof row.name === 'string' && row.name.length > 0 ? row.name : 'item';
      if (row.merged) {
        mergedNames.push(name);
      } else {
        addedNames.push(name);
      }
    }

    const message = this.formatAddResult(
      'shopping list',
      addedNames,
      mergedNames,
    );
    const data: Record<string, unknown> = {
      itemsAdded: saved.length,
      items: saved,
      message,
    };
    this.toolResultCollector.addResult(userId, 'addItemsToShoppingList', data);
    return message;
  }

  private async suggestMealsFromPantry(
    userId: string,
    input: { scheduleTopMatches?: boolean; maxSuggestions?: number },
  ): Promise<string> {
    const pantry = await this.prisma.pantryItem.findMany({
      where: { userId },
      include: { ingredient: true },
    });
    const recipes = await this.prisma.recipe.findMany({ where: { userId } });

    if (recipes.length === 0) {
      return 'No saved recipes to suggest from. Create or import recipes first.';
    }

    if (pantry.length === 0) {
      return 'Pantry is empty. Ask the user to add pantry items (or import a recipe) — keep the reply to one short status and one next step.';
    }

    // Presence-based match: quantity is often 0 for AI-created recipes / pantry
    // "I have some" entries, so requiring available >= needed && needed > 0
    // produced all-zero scores and ignored the pantry.
    const pantryIngredientIds = new Set<string>();
    const pantryNames = new Set<string>();
    for (const item of pantry) {
      pantryIngredientIds.add(item.ingredientId);
      pantryNames.add(item.ingredient.name.toLowerCase());
    }

    const limit =
      input.maxSuggestions && input.maxSuggestions > 0
        ? Math.min(input.maxSuggestions, 10)
        : 5;

    const suggestions: Array<Record<string, unknown>> = [];
    for (const recipe of recipes) {
      const ingredients = await this.prisma.recipeIngredient.findMany({
        where: { recipeId: recipe.id },
        include: { ingredient: true },
      });
      if (ingredients.length === 0) {
        continue;
      }

      let matched = 0;
      const missing: string[] = [];
      for (const row of ingredients) {
        const inPantry =
          pantryIngredientIds.has(row.ingredientId) ||
          pantryNames.has(row.ingredient.name.toLowerCase());
        if (inPantry) {
          matched += 1;
        } else {
          missing.push(row.ingredient.name);
        }
      }

      const score = matched / ingredients.length;
      suggestions.push({
        recipeId: recipe.id,
        recipeName: recipe.mealName,
        matchScore: Math.round(score * 100),
        missingIngredients: missing,
      });
    }

    suggestions.sort((a, b) => Number(b.matchScore) - Number(a.matchScore));
    const usable = suggestions.filter((s) => Number(s.matchScore) > 0);
    const top = (usable.length > 0 ? usable : []).slice(0, limit);
    if (top.length === 0) {
      return 'No usable pantry matches (all scores 0%). Ask the user to add real pantry items or import a recipe — one short status and one next step only.';
    }

    const scheduled: Array<Record<string, unknown>> = [];
    if (input.scheduleTopMatches && top.length > 0) {
      const today = new Date().toISOString().slice(0, 10);
      const best = top[0];
      const created = await this.mealPlansService.createMealPlan(userId, {
        recipe_id: String(best.recipeId),
        meal_type: DEFAULT_MEAL_TYPE,
        serving_date: today,
      });
      scheduled.push(created.mealPlan);
    }

    const data: Record<string, unknown> = {
      suggestions: top,
      scheduled,
      message: `Found ${top.length} meal suggestion(s).`,
    };
    this.toolResultCollector.addResult(userId, 'suggestMealsFromPantry', data);

    return top
      .map((s) => `${String(s.recipeName)} (${String(s.matchScore)}% match)`)
      .join(', ');
  }

  private async insertAllPantryItems(
    userId: string,
    items: Array<{
      name: string;
      quantity?: string;
      unit?: string;
      notes?: string;
    }>,
  ): Promise<Array<Record<string, unknown>>> {
    const saved: Array<Record<string, unknown>> = [];
    const now = BigInt(nowUnixSeconds());

    for (const item of items) {
      if (!item?.name || item.name.trim().length === 0) {
        continue;
      }

      const ingredient = await this.resolveIngredientByName(item.name);
      const existing = await this.prisma.pantryItem.findFirst({
        where: { userId, ingredientId: ingredient.id },
      });

      const quantity = this.parseQuantity(item.quantity);
      const unit =
        item.unit ?? ingredient.baseUnit ?? ingredient.defaultUnit ?? '';

      if (existing) {
        const updated = await this.prisma.pantryItem.update({
          where: { id: existing.id },
          data: {
            quantity: (existing.quantity ?? 0) + quantity,
            unit: unit || existing.unit,
            notes: item.notes ?? existing.notes,
            updatedAt: now,
          },
        });
        saved.push({
          id: updated.id,
          name: ingredient.name,
          quantity: updated.quantity,
          unit: updated.unit,
          merged: true,
        });
      } else {
        const created = await this.prisma.pantryItem.create({
          data: {
            userId,
            ingredientId: ingredient.id,
            quantity,
            unit: unit || null,
            notes: item.notes ?? null,
            createdAt: now,
            updatedAt: now,
          },
        });
        saved.push({
          id: created.id,
          name: ingredient.name,
          quantity: created.quantity,
          unit: created.unit,
          merged: false,
        });
      }
    }

    return saved;
  }

  private async insertAllShoppingListItems(
    userId: string,
    items: Array<{ name: string; quantity?: string; unit?: string }>,
  ): Promise<Array<Record<string, unknown>>> {
    const saved: Array<Record<string, unknown>> = [];

    for (const item of items) {
      if (!item?.name || item.name.trim().length === 0) {
        continue;
      }

      const ingredient = await this.resolveIngredientByName(item.name);
      const existing = await this.prisma.shoppingListItem.findFirst({
        where: { userId, ingredientId: ingredient.id, checked: false },
      });

      const quantity = item.quantity ? this.parseQuantity(item.quantity) : null;
      const unit =
        item.unit ?? ingredient.baseUnit ?? ingredient.defaultUnit ?? '';

      if (existing) {
        const updated = await this.shoppingListService.updateItem(
          userId,
          existing.id,
          {
            quantity: (existing.quantity ?? 0) + (quantity ?? 0),
            unit: unit || existing.unit || undefined,
          },
        );
        saved.push({
          id: updated.id,
          name: ingredient.name,
          quantity: updated.quantity,
          unit: updated.unit,
          merged: true,
        });
      } else {
        const created = await this.shoppingListService.createItem(userId, {
          name: ingredient.name,
          quantity: quantity ?? undefined,
          unit: unit || undefined,
        });
        saved.push({
          id: created.id,
          name: ingredient.name,
          quantity: created.quantity,
          unit: created.unit,
          merged: false,
        });
      }
    }

    return saved;
  }

  private async saveRecipeIngredients(
    recipeId: string,
    ingredients: Array<{
      name: string;
      quantity?: string;
      unit?: string;
      note?: string;
    }>,
    now: bigint,
  ): Promise<number> {
    let count = 0;
    for (const input of ingredients) {
      if (!input?.name || input.name.trim().length === 0) {
        continue;
      }
      const ingredient = await this.resolveIngredientByName(input.name);
      await this.prisma.recipeIngredient.create({
        data: {
          recipeId,
          ingredientId: ingredient.id,
          quantity: this.parseQuantity(input.quantity),
          unit:
            input.unit ?? ingredient.baseUnit ?? ingredient.defaultUnit ?? null,
          note: input.note ?? null,
          createdAt: now,
          updatedAt: now,
        },
      });
      count += 1;
    }
    return count;
  }

  private async resolveIngredientByName(name: string) {
    const existing = await this.prisma.ingredient.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
    if (existing) {
      return existing;
    }
    const now = BigInt(nowUnixSeconds());
    return this.prisma.ingredient.create({
      data: {
        name: name.trim(),
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  private async getOrCreateUncategorized(userId: string) {
    await this.foldersService.listFolders(userId);
    const folder = await this.prisma.folder.findFirst({
      where: {
        userId,
        name: { equals: 'Uncategorized', mode: 'insensitive' },
      },
    });
    if (folder) {
      return folder;
    }
    return this.foldersService.createFolder(userId, { name: 'Uncategorized' });
  }

  private recipeCreatedData(
    recipe: { id: string; mealName: string },
    ingredientCount: number,
    steps: string[],
  ): Record<string, unknown> {
    return {
      recipeId: recipe.id,
      recipeName: recipe.mealName,
      ingredientCount,
      steps,
    };
  }

  private mealPlanData(
    created: MealPlanDto,
    message: string,
  ): Record<string, unknown> {
    return {
      mealPlanId: created.id,
      recipeName: created.meal_name,
      mealType: created.meal_type,
      servingDate: created.serving_date,
      message,
    };
  }

  private summarizePreferences(prefs: {
    allergies: string[];
    dislikes: string[];
    likes: string[];
    dietaryRestrictions: string[];
    householdNotes: string | null;
    measurementUnit: string | null;
    notes: string | null;
  }): string {
    return (
      `Allergies: ${this.joinOrNone(prefs.allergies)}` +
      `; Dislikes: ${this.joinOrNone(prefs.dislikes)}` +
      `; Likes: ${this.joinOrNone(prefs.likes)}` +
      `; Dietary restrictions: ${this.joinOrNone(prefs.dietaryRestrictions)}` +
      `; Household notes: ${this.blankToNone(prefs.householdNotes)}` +
      `; Units: ${prefs.measurementUnit ?? 'metric'}` +
      `; Notes: ${this.blankToNone(prefs.notes)}`
    );
  }

  private joinOrNone(values?: string[]): string {
    if (!values || values.length === 0) {
      return 'none';
    }
    return values.join(', ');
  }

  private blankToNone(value: string | null | undefined): string {
    if (!value || value.trim().length === 0) {
      return 'none';
    }
    return value.trim();
  }

  private parseUuid(value: string | undefined): string | null {
    if (!value || value.trim().length === 0) {
      return null;
    }
    const trimmed = value.trim();
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(trimmed) ? trimmed : null;
  }

  private async resolveRecipeReference(
    userId: string,
    recipeId?: string,
    recipeName?: string,
  ): Promise<string | null> {
    if (recipeId && recipeId.trim().length > 0) {
      const parsed = this.parseUuid(recipeId);
      if (parsed) {
        const recipe = await this.prisma.recipe.findFirst({
          where: { id: parsed, userId },
        });
        if (recipe) {
          return recipe.id;
        }
      }
    }

    if (!recipeName || recipeName.trim().length === 0) {
      return null;
    }

    const target = recipeName.trim();
    const recipes = await this.prisma.recipe.findMany({ where: { userId } });

    for (const recipe of recipes) {
      if (recipe.mealName.toLowerCase() === target.toLowerCase()) {
        return recipe.id;
      }
    }

    for (const recipe of recipes) {
      const name = recipe.mealName;
      if (!name) {
        continue;
      }
      if (
        name.toLowerCase().includes(target.toLowerCase()) ||
        target.toLowerCase().includes(name.toLowerCase())
      ) {
        return recipe.id;
      }
    }

    return null;
  }

  private resolveServingDate(servingDate?: string): string | null {
    if (!servingDate || servingDate.trim().length === 0) {
      return new Date().toISOString().slice(0, 10);
    }
    return this.resolveOptionalDate(servingDate);
  }

  private resolveOptionalDate(servingDate?: string): string | null {
    if (!servingDate || servingDate.trim().length === 0) {
      return null;
    }
    const trimmed = servingDate.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const parts = trimmed.split(/[-/]/);
    if (parts.length === 2) {
      const month = Number.parseInt(parts[0], 10);
      const day = Number.parseInt(parts[1], 10);
      if (!Number.isNaN(month) && !Number.isNaN(day)) {
        const year = new Date().getFullYear();
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
    return null;
  }

  private withinDateRange(
    servingDate: string,
    fromDate?: string,
    toDate?: string,
  ): boolean {
    if (!fromDate && !toDate) {
      return true;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(servingDate)) {
      return true;
    }
    if (fromDate && servingDate < fromDate) {
      return false;
    }
    if (toDate && servingDate > toDate) {
      return false;
    }
    return true;
  }

  private parseQuantity(quantity?: string): number {
    if (!quantity || quantity.trim().length === 0) {
      return 0;
    }
    const parsed = Number.parseFloat(quantity);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private formatAddResult(
    destination: string,
    addedNames: string[],
    mergedNames: string[],
  ): string {
    const parts: string[] = [];
    if (addedNames.length > 0) {
      parts.push(`Added to ${destination}: ${addedNames.join(', ')}`);
    }
    if (mergedNames.length > 0) {
      parts.push(
        `Merged into existing (qty increased): ${mergedNames.join(', ')}`,
      );
    }
    if (parts.length === 0) {
      return 'No items provided.';
    }
    return `${parts.join('. ')}.`;
  }
}
