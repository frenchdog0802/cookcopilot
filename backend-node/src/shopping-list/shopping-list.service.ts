import { Injectable } from '@nestjs/common';
import type { Ingredient, ShoppingListItem } from '@prisma/client';
import { NotFoundError } from '../common/errors/http-errors';
import { bigintToNumber } from '../common/mappers/user.mapper';
import { nowUnixSeconds } from '../common/time';
import { PrismaService } from '../prisma/prisma.service';
import {
  BulkShoppingListItemsRequestDto,
  CreateShoppingListItemRequestDto,
  UpdateShoppingListItemRequestDto,
  type ShoppingListItemDto,
} from './dto/shopping-list.dto';

@Injectable()
export class ShoppingListService {
  constructor(private readonly prisma: PrismaService) {}

  async listItems(userId: string): Promise<ShoppingListItemDto[]> {
    const items = await this.prisma.shoppingListItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((item) => this.toDto(item));
  }

  async getItem(userId: string, id: string): Promise<ShoppingListItemDto> {
    const item = await this.prisma.shoppingListItem.findFirst({
      where: { id, userId },
    });
    if (!item) {
      throw new NotFoundError('Shopping list item not found');
    }
    return this.toDto(item);
  }

  async createItem(
    userId: string,
    dto: CreateShoppingListItemRequestDto,
  ): Promise<ShoppingListItemDto> {
    const ingredient = await this.resolveIngredient(dto);
    await this.ensurePantryRow(userId, ingredient);

    const now = BigInt(nowUnixSeconds());
    const item = await this.prisma.shoppingListItem.create({
      data: {
        userId,
        ingredientId: ingredient.id,
        quantity: dto.quantity ?? null,
        unit: dto.unit ?? ingredient.baseUnit ?? ingredient.defaultUnit ?? null,
        checked: dto.checked ?? false,
        hasBeenAddedToPantry: false,
        createdAt: now,
        updatedAt: now,
      },
    });
    return this.toDto(item);
  }

  async bulkCreateItems(
    userId: string,
    dto: BulkShoppingListItemsRequestDto,
  ): Promise<ShoppingListItemDto[]> {
    const results: ShoppingListItemDto[] = [];
    for (const item of dto.items) {
      results.push(await this.createItem(userId, item));
    }
    return results;
  }

  async updateItem(
    userId: string,
    id: string,
    dto: UpdateShoppingListItemRequestDto,
  ): Promise<ShoppingListItemDto> {
    const existing = await this.prisma.shoppingListItem.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundError('Shopping list item not found');
    }

    const item = await this.prisma.shoppingListItem.update({
      where: { id },
      data: {
        quantity: dto.quantity ?? existing.quantity,
        unit: dto.unit ?? existing.unit,
        checked: dto.checked ?? existing.checked,
        updatedAt: BigInt(nowUnixSeconds()),
      },
    });
    return this.toDto(item);
  }

  async deleteItem(userId: string, id: string): Promise<{ message: string }> {
    const existing = await this.prisma.shoppingListItem.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundError('Shopping list item not found');
    }

    await this.prisma.shoppingListItem.delete({ where: { id } });
    return { message: 'Shopping list item deleted' };
  }

  private async resolveIngredient(
    dto: CreateShoppingListItemRequestDto,
  ): Promise<Ingredient> {
    if (dto.ingredient_id) {
      const ingredient = await this.prisma.ingredient.findUnique({
        where: { id: dto.ingredient_id },
      });
      if (!ingredient) {
        throw new NotFoundError('Ingredient not found');
      }
      return ingredient;
    }

    if (dto.name) {
      const existing = await this.prisma.ingredient.findFirst({
        where: { name: { equals: dto.name, mode: 'insensitive' } },
      });
      if (existing) {
        return existing;
      }

      const now = BigInt(nowUnixSeconds());
      return this.prisma.ingredient.create({
        data: {
          name: dto.name,
          createdAt: now,
          updatedAt: now,
        },
      });
    }

    throw new NotFoundError('Ingredient not found');
  }

  private async ensurePantryRow(
    userId: string,
    ingredient: Ingredient,
  ): Promise<void> {
    const pantryRows = await this.prisma.pantryItem.findMany({
      where: { userId, ingredientId: ingredient.id },
    });
    if (pantryRows.length > 0) {
      return;
    }

    const now = BigInt(nowUnixSeconds());
    await this.prisma.pantryItem.create({
      data: {
        userId,
        ingredientId: ingredient.id,
        quantity: 0,
        unit: ingredient.baseUnit ?? ingredient.defaultUnit ?? null,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  private toDto(item: ShoppingListItem): ShoppingListItemDto {
    return {
      id: item.id,
      ingredient_id: item.ingredientId,
      quantity: item.quantity,
      unit: item.unit,
      checked: item.checked,
      has_been_added_to_pantry: item.hasBeenAddedToPantry,
      created_at: bigintToNumber(item.createdAt),
      updated_at: bigintToNumber(item.updatedAt),
    };
  }
}
