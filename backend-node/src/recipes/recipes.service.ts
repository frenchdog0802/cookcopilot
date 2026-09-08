import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Recipe, RecipeIngredient } from '@prisma/client';
import {
  QuotaExceededError,
  NotFoundError,
} from '../common/errors/http-errors';
import { bigintToNumber } from '../common/mappers/user.mapper';
import { nowUnixSeconds } from '../common/time';
import type { AppConfig } from '../config/env.schema';
import { FoldersService } from '../folders/folders.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateRecipeRequestDto,
  UpdateRecipeRequestDto,
  type RecipeDto,
  type RecipeIngredientDto,
  type RecipeIngredientInputDto,
} from './dto/recipe.dto';

@Injectable()
export class RecipesService {
  private readonly maxRecipes: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly foldersService: FoldersService,
    configService: ConfigService,
  ) {
    const appConfig = configService.get<AppConfig>('app');
    this.maxRecipes = appConfig?.subscription.free.maxRecipes ?? 50;
  }

  async listRecipes(userId: string): Promise<RecipeDto[]> {
    const recipes = await this.prisma.recipe.findMany({
      where: { userId },
      orderBy: { mealName: 'asc' },
    });
    const ingredientsByRecipe = await this.loadIngredientsForRecipes(
      recipes.map((recipe) => recipe.id),
    );
    return recipes.map((recipe) =>
      this.toDto(recipe, ingredientsByRecipe.get(recipe.id) ?? []),
    );
  }

  async getRecipe(userId: string, id: string): Promise<RecipeDto> {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id, userId },
    });
    if (!recipe) {
      throw new NotFoundError('Recipe not found');
    }
    const ingredients = await this.prisma.recipeIngredient.findMany({
      where: { recipeId: id },
    });
    return this.toDto(recipe, ingredients);
  }

  async createRecipe(
    userId: string,
    dto: CreateRecipeRequestDto,
  ): Promise<RecipeDto> {
    await this.checkRecipeQuota(userId);

    if (dto.folder_id) {
      await this.foldersService.getFolder(userId, dto.folder_id);
    }

    const now = BigInt(nowUnixSeconds());
    const recipe = await this.prisma.recipe.create({
      data: {
        userId,
        mealName: dto.meal_name,
        folderId: dto.folder_id ?? null,
        description: dto.description ?? null,
        instructions: dto.instructions ?? null,
        imageUrl: dto.image_url ?? null,
        imagePublicId: null,
        createdAt: now,
        updatedAt: now,
      },
    });

    const ingredients = await this.saveIngredients(
      recipe.id,
      dto.ingredients ?? [],
      now,
    );

    return this.toDto(recipe, ingredients);
  }

  async updateRecipe(
    userId: string,
    id: string,
    dto: UpdateRecipeRequestDto,
  ): Promise<RecipeDto> {
    const existing = await this.prisma.recipe.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundError('Recipe not found');
    }

    if (dto.folder_id) {
      await this.foldersService.getFolder(userId, dto.folder_id);
    }

    const now = BigInt(nowUnixSeconds());
    const recipe = await this.prisma.recipe.update({
      where: { id },
      data: {
        mealName: dto.meal_name ?? existing.mealName,
        folderId: dto.folder_id ?? existing.folderId,
        description: dto.description ?? existing.description,
        instructions: dto.instructions ?? existing.instructions,
        imageUrl: dto.image_url ?? existing.imageUrl,
        updatedAt: now,
      },
    });

    let ingredients = await this.prisma.recipeIngredient.findMany({
      where: { recipeId: id },
    });

    if (dto.ingredients !== undefined) {
      await this.prisma.recipeIngredient.deleteMany({
        where: { recipeId: id },
      });
      ingredients = await this.saveIngredients(id, dto.ingredients, now);
    }

    return this.toDto(recipe, ingredients);
  }

  async moveRecipeToMealTypeFolder(
    userId: string,
    recipeId: string,
    mealType: string | null | undefined,
  ): Promise<void> {
    if (
      userId == null ||
      recipeId == null ||
      mealType == null ||
      mealType.trim() === ''
    ) {
      return;
    }

    let folderName: string | null;
    switch (mealType.trim().toLowerCase()) {
      case 'breakfast':
        folderName = 'Breakfast';
        break;
      case 'lunch':
        folderName = 'Lunch';
        break;
      case 'dinner':
        folderName = 'Dinner';
        break;
      default:
        folderName = null;
    }
    if (folderName == null) {
      return;
    }

    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
    });
    if (recipe == null || recipe.userId !== userId) {
      return;
    }

    const folder = await this.foldersService.findOrCreateByName(
      userId,
      folderName,
    );
    await this.prisma.recipe.update({
      where: { id: recipeId },
      data: {
        folderId: folder.id,
        updatedAt: BigInt(nowUnixSeconds()),
      },
    });
  }

  async deleteRecipe(userId: string, id: string): Promise<{ message: string }> {
    const existing = await this.prisma.recipe.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundError('Recipe not found');
    }

    await this.prisma.recipeIngredient.deleteMany({ where: { recipeId: id } });
    await this.prisma.recipe.delete({ where: { id } });
    return { message: 'Recipe deleted' };
  }

  private async checkRecipeQuota(userId: string): Promise<void> {
    if (this.maxRecipes < 0) {
      return;
    }

    const count = await this.prisma.recipe.count({ where: { userId } });
    if (count >= this.maxRecipes) {
      throw new QuotaExceededError(
        'recipes',
        `You've reached your recipe limit (${this.maxRecipes}). Upgrade to Pro for unlimited recipes.`,
      );
    }
  }

  private async loadIngredientsForRecipes(
    recipeIds: string[],
  ): Promise<Map<string, RecipeIngredient[]>> {
    const map = new Map<string, RecipeIngredient[]>();
    if (recipeIds.length === 0) {
      return map;
    }

    const rows = await this.prisma.recipeIngredient.findMany({
      where: { recipeId: { in: recipeIds } },
    });

    for (const row of rows) {
      const current = map.get(row.recipeId) ?? [];
      current.push(row);
      map.set(row.recipeId, current);
    }

    return map;
  }

  private async saveIngredients(
    recipeId: string,
    inputs: RecipeIngredientInputDto[],
    now: bigint,
  ): Promise<RecipeIngredient[]> {
    const saved: RecipeIngredient[] = [];

    for (const input of inputs) {
      const ingredientId = await this.resolveIngredientId(input);
      const row = await this.prisma.recipeIngredient.create({
        data: {
          recipeId,
          ingredientId,
          quantity: input.quantity,
          unit: input.unit ?? null,
          note: input.note ?? null,
          createdAt: now,
          updatedAt: now,
        },
      });
      saved.push(row);
    }

    return saved;
  }

  private async resolveIngredientId(
    input: RecipeIngredientInputDto,
  ): Promise<string> {
    if (input.ingredient_id) {
      const existing = await this.prisma.ingredient.findUnique({
        where: { id: input.ingredient_id },
      });
      if (!existing) {
        throw new NotFoundError('Ingredient not found');
      }
      return existing.id;
    }

    if (input.name) {
      const existing = await this.prisma.ingredient.findFirst({
        where: { name: { equals: input.name, mode: 'insensitive' } },
      });
      if (existing) {
        return existing.id;
      }

      const now = BigInt(nowUnixSeconds());
      const created = await this.prisma.ingredient.create({
        data: {
          name: input.name,
          createdAt: now,
          updatedAt: now,
        },
      });
      return created.id;
    }

    throw new NotFoundError('Ingredient not found');
  }

  private toDto(recipe: Recipe, ingredients: RecipeIngredient[]): RecipeDto {
    return {
      id: recipe.id,
      meal_name: recipe.mealName,
      folder_id: recipe.folderId,
      description: recipe.description,
      instructions: recipe.instructions,
      image_url: recipe.imageUrl,
      image_public_id: recipe.imagePublicId,
      ingredients: ingredients.map((row): RecipeIngredientDto => ({
        id: row.id,
        ingredient_id: row.ingredientId,
        quantity: row.quantity,
        unit: row.unit,
        note: row.note,
      })),
      created_at: bigintToNumber(recipe.createdAt),
      updated_at: bigintToNumber(recipe.updatedAt),
    };
  }
}
