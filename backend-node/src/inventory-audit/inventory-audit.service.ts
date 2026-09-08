import { Injectable } from '@nestjs/common';
import { nowUnixSeconds } from '../common/time';
import { PrismaService } from '../prisma/prisma.service';

export enum InventoryChangeSource {
  MEAL_PLANNED = 'MEAL_PLANNED',
  SHOPPING_CHECKED = 'SHOPPING_CHECKED',
  SHOPPING_UNCHECKED = 'SHOPPING_UNCHECKED',
  MANUAL_ADJUST = 'MANUAL_ADJUST',
  MEAL_CONFIRMED = 'MEAL_CONFIRMED',
}

@Injectable()
export class InventoryAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    userId: string;
    ingredientId: string;
    pantryItemId: string | null;
    source: InventoryChangeSource;
    deltaQuantity: number;
    previousQuantity: number | null;
    newQuantity: number | null;
    unit: string | null;
    mealPlanId?: string | null;
    recipeId?: string | null;
    shoppingListItemId?: string | null;
    note?: string | null;
  }): Promise<void> {
    if (params.deltaQuantity === 0) {
      return;
    }

    await this.prisma.inventoryAuditLog.create({
      data: {
        userId: params.userId,
        ingredientId: params.ingredientId,
        pantryItemId: params.pantryItemId,
        source: params.source,
        deltaQuantity: params.deltaQuantity,
        previousQuantity: params.previousQuantity,
        newQuantity: params.newQuantity,
        unit: params.unit ?? '',
        mealPlanId: params.mealPlanId ?? null,
        recipeId: params.recipeId ?? null,
        shoppingListItemId: params.shoppingListItemId ?? null,
        note: params.note ?? null,
        createdAt: BigInt(nowUnixSeconds()),
      },
    });
  }
}
