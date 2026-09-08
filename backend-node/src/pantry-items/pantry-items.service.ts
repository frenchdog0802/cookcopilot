import { Injectable } from '@nestjs/common';
import type { PantryItem } from '@prisma/client';
import { NotFoundError } from '../common/errors/http-errors';
import { bigintToNumber } from '../common/mappers/user.mapper';
import { nowUnixSeconds } from '../common/time';
import { PrismaService } from '../prisma/prisma.service';
import {
  BulkPantryItemsRequestDto,
  CreatePantryItemRequestDto,
  UpdatePantryItemRequestDto,
  type PantryItemDto,
} from './dto/pantry-item.dto';

@Injectable()
export class PantryItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async listItems(userId: string): Promise<PantryItemDto[]> {
    const items = await this.prisma.pantryItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((item) => this.toDto(item));
  }

  async getItem(userId: string, id: string): Promise<PantryItemDto> {
    const item = await this.prisma.pantryItem.findFirst({
      where: { id, userId },
    });
    if (!item) {
      throw new NotFoundError('Pantry item not found');
    }
    return this.toDto(item);
  }

  async createItem(
    userId: string,
    dto: CreatePantryItemRequestDto,
  ): Promise<PantryItemDto> {
    await this.ensureIngredientExists(dto.ingredient_id);
    const now = BigInt(nowUnixSeconds());

    const item = await this.prisma.pantryItem.create({
      data: {
        userId,
        ingredientId: dto.ingredient_id,
        quantity: dto.quantity,
        unit: dto.unit ?? null,
        notes: dto.notes ?? null,
        createdAt: now,
        updatedAt: now,
      },
    });
    return this.toDto(item);
  }

  async bulkCreateItems(
    userId: string,
    dto: BulkPantryItemsRequestDto,
  ): Promise<PantryItemDto[]> {
    const results: PantryItemDto[] = [];
    for (const item of dto.items) {
      results.push(await this.createItem(userId, item));
    }
    return results;
  }

  async bulkUpdateItems(
    userId: string,
    dto: BulkPantryItemsRequestDto,
  ): Promise<PantryItemDto[]> {
    const results: PantryItemDto[] = [];
    for (const item of dto.items) {
      const existing = await this.prisma.pantryItem.findFirst({
        where: { userId, ingredientId: item.ingredient_id },
      });
      if (existing) {
        results.push(
          await this.updateItem(userId, existing.id, {
            quantity: item.quantity,
            unit: item.unit,
            notes: item.notes,
          }),
        );
      } else {
        results.push(await this.createItem(userId, item));
      }
    }
    return results;
  }

  async updateItem(
    userId: string,
    id: string,
    dto: UpdatePantryItemRequestDto,
  ): Promise<PantryItemDto> {
    const existing = await this.prisma.pantryItem.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundError('Pantry item not found');
    }

    const item = await this.prisma.pantryItem.update({
      where: { id },
      data: {
        quantity: dto.quantity ?? existing.quantity,
        unit: dto.unit ?? existing.unit,
        notes: dto.notes ?? existing.notes,
        updatedAt: BigInt(nowUnixSeconds()),
      },
    });
    return this.toDto(item);
  }

  async deleteItem(userId: string, id: string): Promise<{ message: string }> {
    const existing = await this.prisma.pantryItem.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundError('Pantry item not found');
    }

    await this.prisma.pantryItem.delete({ where: { id } });
    return { message: 'Pantry item deleted' };
  }

  private async ensureIngredientExists(ingredientId: string): Promise<void> {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id: ingredientId },
    });
    if (!ingredient) {
      throw new NotFoundError('Ingredient not found');
    }
  }

  private toDto(item: PantryItem): PantryItemDto {
    return {
      id: item.id,
      ingredient_id: item.ingredientId,
      quantity: item.quantity,
      unit: item.unit,
      notes: item.notes,
      created_at: bigintToNumber(item.createdAt),
      updated_at: bigintToNumber(item.updatedAt),
    };
  }
}
