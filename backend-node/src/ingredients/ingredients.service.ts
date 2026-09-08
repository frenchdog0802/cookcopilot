import { Injectable } from '@nestjs/common';
import type { Ingredient } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../common/errors/http-errors';
import { bigintToNumber } from '../common/mappers/user.mapper';
import { nowUnixSeconds } from '../common/time';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateIngredientRequestDto,
  UpdateIngredientRequestDto,
  type IngredientDto,
} from './dto/ingredient.dto';

@Injectable()
export class IngredientsService {
  constructor(private readonly prisma: PrismaService) {}

  async listIngredients(query?: string): Promise<IngredientDto[]> {
    const ingredients = await this.prisma.ingredient.findMany({
      where: query
        ? {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          }
        : undefined,
      orderBy: { name: 'asc' },
    });
    return ingredients.map((ingredient) => this.toDto(ingredient));
  }

  async getIngredient(id: string): Promise<IngredientDto> {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id },
    });
    if (!ingredient) {
      throw new NotFoundError('Ingredient not found');
    }
    return this.toDto(ingredient);
  }

  async createIngredient(
    dto: CreateIngredientRequestDto,
  ): Promise<IngredientDto> {
    const now = BigInt(nowUnixSeconds());
    const ingredient = await this.prisma.ingredient.create({
      data: {
        name: dto.name,
        defaultUnit: dto.default_unit ?? null,
        unitKind: dto.unit_kind ?? null,
        baseUnit: dto.base_unit ?? null,
        defaultDisplayUnit: dto.default_display_unit ?? null,
        imageUrl: dto.image_url ?? null,
        createdAt: now,
        updatedAt: now,
      },
    });
    return this.toDto(ingredient);
  }

  async bulkCreateIngredients(
    items: CreateIngredientRequestDto[],
  ): Promise<IngredientDto[]> {
    const results: IngredientDto[] = [];
    for (const item of items) {
      results.push(await this.createIngredient(item));
    }
    return results;
  }

  async updateIngredient(
    id: string,
    dto: UpdateIngredientRequestDto,
  ): Promise<IngredientDto> {
    const existing = await this.prisma.ingredient.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Ingredient not found');
    }

    const ingredient = await this.prisma.ingredient.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        defaultUnit: dto.default_unit ?? existing.defaultUnit,
        unitKind: dto.unit_kind ?? existing.unitKind,
        baseUnit: dto.base_unit ?? existing.baseUnit,
        defaultDisplayUnit:
          dto.default_display_unit ?? existing.defaultDisplayUnit,
        imageUrl: dto.image_url ?? existing.imageUrl,
        updatedAt: BigInt(nowUnixSeconds()),
      },
    });
    return this.toDto(ingredient);
  }

  async deleteIngredient(id: string): Promise<{ message: string }> {
    const existing = await this.prisma.ingredient.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Ingredient not found');
    }

    const [recipeUses, pantryUses, shoppingUses] = await Promise.all([
      this.prisma.recipeIngredient.count({ where: { ingredientId: id } }),
      this.prisma.pantryItem.count({ where: { ingredientId: id } }),
      this.prisma.shoppingListItem.count({ where: { ingredientId: id } }),
    ]);
    if (recipeUses + pantryUses + shoppingUses > 0) {
      throw new BadRequestError('Ingredient is in use and cannot be deleted');
    }

    await this.prisma.ingredient.delete({ where: { id } });
    return { message: 'Ingredient deleted' };
  }

  private toDto(ingredient: Ingredient): IngredientDto {
    return {
      id: ingredient.id,
      name: ingredient.name,
      default_unit: ingredient.defaultUnit,
      unit_kind: ingredient.unitKind,
      base_unit: ingredient.baseUnit,
      default_display_unit: ingredient.defaultDisplayUnit,
      image_url: ingredient.imageUrl,
      created_at: bigintToNumber(ingredient.createdAt),
      updated_at: bigintToNumber(ingredient.updatedAt),
    };
  }
}
