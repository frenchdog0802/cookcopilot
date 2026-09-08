import { Injectable } from '@nestjs/common';
import type { MealPlan, Recipe } from '@prisma/client';
import {
  clampShortage,
  resolveBaseUnit,
  toIngredientBaseLenient,
} from '../common/unit/unit-converter';
import { BadRequestError, NotFoundError } from '../common/errors/http-errors';
import { nowUnixSeconds } from '../common/time';
import {
  InventoryAuditService,
  InventoryChangeSource,
} from '../inventory-audit/inventory-audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { RecipesService } from '../recipes/recipes.service';
import {
  CreateMealPlanRequestDto,
  UpdateMealPlanRequestDto,
  type ConfirmMealPlanResponseDto,
  type CreateMealPlanResponseDto,
  type MealPlanDto,
  type NotEnoughItemDto,
  type SkipMealPlanResponseDto,
} from './dto/meal-plan.dto';

const PENDING_CONFIRM_AUTO_SKIP_DAYS = 7;

type MealPlanWithRecipe = MealPlan & { recipe: Recipe | null };

@Injectable()
export class MealPlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recipesService: RecipesService,
    private readonly inventoryAuditService: InventoryAuditService,
  ) {}

  async listMealPlans(userId: string): Promise<MealPlanDto[]> {
    await this.transitionStatusesForUser(userId);
    const mealPlans = await this.prisma.mealPlan.findMany({
      where: { userId },
      include: { recipe: true },
      orderBy: { servingDate: 'asc' },
    });
    return mealPlans
      .filter((mealPlan) => mealPlan.recipe != null)
      .map((mealPlan) => this.toDto(mealPlan as MealPlanWithRecipe));
  }

  async getPendingConfirmations(userId: string): Promise<MealPlanDto[]> {
    await this.transitionStatusesForUser(userId);
    const mealPlans = await this.prisma.mealPlan.findMany({
      where: { userId, status: 'PENDING_CONFIRM' },
      include: { recipe: true },
      orderBy: { servingDate: 'asc' },
    });
    return mealPlans
      .filter((mealPlan) => mealPlan.recipe != null)
      .map((mealPlan) => this.toDto(mealPlan as MealPlanWithRecipe));
  }

  async getMealPlanById(userId: string, id: string): Promise<MealPlanDto> {
    const mealPlan = await this.prisma.mealPlan.findFirst({
      where: { id, userId },
      include: { recipe: true },
    });
    if (!mealPlan) {
      throw new NotFoundError('Meal plan not found');
    }
    return this.toDto(mealPlan);
  }

  async createMealPlan(
    userId: string,
    dto: CreateMealPlanRequestDto,
  ): Promise<CreateMealPlanResponseDto> {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id: dto.recipe_id, userId },
    });
    if (!recipe) {
      throw new NotFoundError('Recipe not found');
    }

    const initialStatus = this.resolveInitialStatus(dto.serving_date);
    const now = BigInt(nowUnixSeconds());

    const mealPlan = await this.prisma.mealPlan.create({
      data: {
        userId,
        recipeId: dto.recipe_id,
        mealType: dto.meal_type ?? null,
        servingDate: dto.serving_date ?? null,
        status: initialStatus,
        createdAt: now,
        updatedAt: now,
      },
      include: { recipe: true },
    });

    await this.recipesService.moveRecipeToMealTypeFolder(
      userId,
      dto.recipe_id,
      dto.meal_type,
    );

    const recipeIngredients = await this.prisma.recipeIngredient.findMany({
      where: { recipeId: dto.recipe_id },
    });
    const pantryItems = await this.prisma.pantryItem.findMany({
      where: { userId },
    });
    const ingredientIds = [
      ...new Set(recipeIngredients.map((row) => row.ingredientId)),
    ];
    const ingredients = await this.prisma.ingredient.findMany({
      where: { id: { in: ingredientIds } },
    });
    const ingredientsById = new Map(ingredients.map((ing) => [ing.id, ing]));

    const notEnoughItems: NotEnoughItemDto[] = [];

    for (const recipeIngredient of recipeIngredients) {
      const ingredient = ingredientsById.get(recipeIngredient.ingredientId);
      if (!ingredient) {
        continue;
      }

      const baseUnit = resolveBaseUnit(ingredient);
      const pantryItem = pantryItems.find(
        (row) => row.ingredientId === recipeIngredient.ingredientId,
      );

      const needed = recipeIngredient.quantity ?? 0;
      let available = 0;
      if (pantryItem) {
        available = toIngredientBaseLenient(
          ingredient,
          pantryItem.quantity ?? 0,
          pantryItem.unit != null && pantryItem.unit.trim() !== ''
            ? pantryItem.unit
            : baseUnit,
        );
      }

      const shortage = clampShortage(needed, available);
      if (shortage <= 0) {
        continue;
      }

      notEnoughItems.push({
        ingredient_id: recipeIngredient.ingredientId,
        name: ingredient.name,
        required_quantity: shortage,
        available_quantity: available,
        unit: baseUnit,
      });

      const existingShoppingItem = await this.prisma.shoppingListItem.findFirst(
        {
          where: {
            userId,
            ingredientId: recipeIngredient.ingredientId,
            checked: false,
          },
        },
      );

      if (existingShoppingItem) {
        const existingBase = toIngredientBaseLenient(
          ingredient,
          existingShoppingItem.quantity ?? 0,
          existingShoppingItem.unit != null &&
            existingShoppingItem.unit.trim() !== ''
            ? existingShoppingItem.unit
            : baseUnit,
        );
        await this.prisma.shoppingListItem.update({
          where: { id: existingShoppingItem.id },
          data: {
            quantity: existingBase + shortage,
            unit: baseUnit,
            updatedAt: BigInt(nowUnixSeconds()),
          },
        });
      } else {
        await this.prisma.shoppingListItem.create({
          data: {
            userId,
            ingredientId: recipeIngredient.ingredientId,
            quantity: shortage,
            unit: baseUnit,
            checked: false,
            hasBeenAddedToPantry: false,
            createdAt: now,
            updatedAt: now,
          },
        });
      }
    }

    return {
      mealPlan: this.toDto({ ...mealPlan, recipe }),
      notEnoughItems,
    };
  }

  async confirmMealPlan(
    userId: string,
    mealPlanId: string,
  ): Promise<ConfirmMealPlanResponseDto> {
    const mealPlan = await this.prisma.mealPlan.findFirst({
      where: { id: mealPlanId, userId },
      include: { recipe: true },
    });
    if (!mealPlan) {
      throw new NotFoundError('Meal plan not found');
    }

    if (mealPlan.status === 'CONFIRMED') {
      return {
        mealPlan: this.toDto(mealPlan),
        shortages: [],
        deducted: [],
        already_confirmed: true,
      };
    }

    if (mealPlan.status === 'SKIPPED') {
      throw new BadRequestError('Cannot confirm a skipped meal plan');
    }

    const recipe = await this.prisma.recipe.findUnique({
      where: { id: mealPlan.recipeId },
    });
    if (!recipe) {
      throw new NotFoundError('Recipe not found');
    }

    const recipeIngredients = await this.prisma.recipeIngredient.findMany({
      where: { recipeId: mealPlan.recipeId },
    });
    const ingredientIds = [
      ...new Set(recipeIngredients.map((row) => row.ingredientId)),
    ];
    const ingredients = await this.prisma.ingredient.findMany({
      where: { id: { in: ingredientIds } },
    });
    const ingredientsById = new Map(ingredients.map((ing) => [ing.id, ing]));

    const shortages: ConfirmMealPlanResponseDto['shortages'] = [];
    const deducted: ConfirmMealPlanResponseDto['deducted'] = [];

    for (const recipeIngredient of recipeIngredients) {
      const ingredient = ingredientsById.get(recipeIngredient.ingredientId);
      if (!ingredient) {
        continue;
      }

      const baseUnit = resolveBaseUnit(ingredient);
      const needed = recipeIngredient.quantity ?? 0;
      if (needed <= 0) {
        continue;
      }

      const pantryItem = await this.prisma.pantryItem.findFirst({
        where: {
          userId,
          ingredientId: recipeIngredient.ingredientId,
        },
      });

      let available = 0;
      if (pantryItem) {
        available = toIngredientBaseLenient(
          ingredient,
          pantryItem.quantity ?? 0,
          pantryItem.unit != null && pantryItem.unit.trim() !== ''
            ? pantryItem.unit
            : baseUnit,
        );
      }

      if (available < needed) {
        shortages.push({
          ingredient_id: recipeIngredient.ingredientId,
          name: ingredient.name,
          needed,
          available,
          unit: baseUnit,
        });
      }

      if (!pantryItem) {
        continue;
      }

      const deductAmount = Math.min(available, needed);
      const newQty = Math.max(0, available - needed);

      await this.prisma.pantryItem.update({
        where: { id: pantryItem.id },
        data: {
          quantity: newQty,
          unit: baseUnit,
          updatedAt: BigInt(nowUnixSeconds()),
        },
      });

      if (deductAmount > 0) {
        await this.inventoryAuditService.log({
          userId,
          ingredientId: recipeIngredient.ingredientId,
          pantryItemId: pantryItem.id,
          source: InventoryChangeSource.MEAL_CONFIRMED,
          deltaQuantity: -deductAmount,
          previousQuantity: available,
          newQuantity: newQty,
          unit: baseUnit,
          mealPlanId: mealPlan.id,
          recipeId: mealPlan.recipeId,
          shoppingListItemId: null,
          note:
            available < needed
              ? 'Confirmed meal; pantry short of recipe need (clamped to 0)'
              : 'Confirmed meal',
        });
      }

      deducted.push({
        ingredient_id: recipeIngredient.ingredientId,
        name: ingredient.name,
        deducted: deductAmount,
        previous_quantity: available,
        new_quantity: newQty,
        unit: baseUnit,
      });
    }

    const updatedMealPlan = await this.prisma.mealPlan.update({
      where: { id: mealPlan.id },
      data: {
        status: 'CONFIRMED',
        updatedAt: BigInt(nowUnixSeconds()),
      },
      include: { recipe: true },
    });

    return {
      mealPlan: this.toDto(updatedMealPlan),
      shortages,
      deducted,
      already_confirmed: false,
    };
  }

  async skipMealPlan(
    userId: string,
    mealPlanId: string,
  ): Promise<SkipMealPlanResponseDto> {
    const mealPlan = await this.prisma.mealPlan.findFirst({
      where: { id: mealPlanId, userId },
      include: { recipe: true },
    });
    if (!mealPlan) {
      throw new NotFoundError('Meal plan not found');
    }

    if (mealPlan.status === 'CONFIRMED') {
      throw new BadRequestError('Cannot skip a confirmed meal plan');
    }

    if (mealPlan.status === 'SKIPPED') {
      return {
        mealPlan: this.toDto(mealPlan),
        already_skipped: true,
      };
    }

    const updatedMealPlan = await this.prisma.mealPlan.update({
      where: { id: mealPlan.id },
      data: {
        status: 'SKIPPED',
        updatedAt: BigInt(nowUnixSeconds()),
      },
      include: { recipe: true },
    });

    return {
      mealPlan: this.toDto(updatedMealPlan),
      already_skipped: false,
    };
  }

  async updateMealPlan(
    userId: string,
    id: string,
    dto: UpdateMealPlanRequestDto,
  ): Promise<MealPlanDto> {
    const existing = await this.prisma.mealPlan.findFirst({
      where: { id, userId },
      include: { recipe: true },
    });
    if (!existing) {
      throw new NotFoundError('Meal plan not found');
    }

    if (dto.recipe_id && dto.recipe_id !== existing.recipeId) {
      const recipe = await this.prisma.recipe.findFirst({
        where: { id: dto.recipe_id, userId },
      });
      if (!recipe) {
        throw new NotFoundError('Recipe not found');
      }
    }

    let status = dto.status ?? existing.status;
    const servingDate = dto.serving_date ?? existing.servingDate;
    if (dto.serving_date != null) {
      if (
        existing.status === 'PLANNED' ||
        existing.status === 'PENDING_CONFIRM'
      ) {
        status = this.resolveInitialStatus(servingDate);
      }
    }

    const mealPlan = await this.prisma.mealPlan.update({
      where: { id },
      data: {
        recipeId: dto.recipe_id ?? existing.recipeId,
        mealType: dto.meal_type ?? existing.mealType,
        servingDate,
        status,
        updatedAt: BigInt(nowUnixSeconds()),
      },
      include: { recipe: true },
    });
    return this.toDto(mealPlan);
  }

  async deleteMealPlan(
    userId: string,
    id: string,
  ): Promise<{ message: string }> {
    const existing = await this.prisma.mealPlan.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundError('Meal plan not found');
    }

    await this.prisma.mealPlan.delete({ where: { id } });
    return { message: 'Meal plan deleted' };
  }

  async transitionStatusesForUser(userId: string): Promise<void> {
    const today = this.todayIsoDate();
    const autoSkipBefore = this.daysAgoIsoDate(PENDING_CONFIRM_AUTO_SKIP_DAYS);

    const userPlans = await this.prisma.mealPlan.findMany({
      where: { userId },
    });

    const changed: Array<{ id: string; status: string }> = [];
    for (const mealPlan of userPlans) {
      if (mealPlan.servingDate == null) {
        continue;
      }
      const status = mealPlan.status ?? 'PLANNED';
      if (status === 'PLANNED' && mealPlan.servingDate < today) {
        changed.push({ id: mealPlan.id, status: 'PENDING_CONFIRM' });
      } else if (
        status === 'PENDING_CONFIRM' &&
        mealPlan.servingDate <= autoSkipBefore
      ) {
        changed.push({ id: mealPlan.id, status: 'SKIPPED' });
      }
    }

    if (changed.length === 0) {
      return;
    }

    const now = BigInt(nowUnixSeconds());
    await this.prisma.$transaction(
      changed.map((row) =>
        this.prisma.mealPlan.update({
          where: { id: row.id },
          data: { status: row.status, updatedAt: now },
        }),
      ),
    );
  }

  private resolveInitialStatus(servingDate: string | null | undefined): string {
    if (servingDate == null || servingDate.trim() === '') {
      return 'PLANNED';
    }
    if (servingDate < this.todayIsoDate()) {
      return 'PENDING_CONFIRM';
    }
    return 'PLANNED';
  }

  private todayIsoDate(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private daysAgoIsoDate(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().slice(0, 10);
  }

  private toDto(mealPlan: MealPlanWithRecipe): MealPlanDto {
    const recipe = mealPlan.recipe;
    return {
      id: mealPlan.id,
      recipe_id: mealPlan.recipeId,
      meal_type: mealPlan.mealType,
      serving_date: mealPlan.servingDate,
      status: mealPlan.status ?? 'PLANNED',
      meal_name: recipe?.mealName ?? null,
      image_url: this.buildImageMap(recipe),
    };
  }

  private buildImageMap(
    recipe: Recipe | null | undefined,
  ): MealPlanDto['image_url'] {
    if (recipe?.imageUrl == null || recipe.imageUrl.trim() === '') {
      return null;
    }
    return {
      url: recipe.imageUrl,
      public_id: recipe.imagePublicId,
    };
  }
}
