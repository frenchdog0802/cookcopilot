import { Module } from '@nestjs/common';
import { InventoryAuditModule } from '../inventory-audit/inventory-audit.module';
import { RecipesModule } from '../recipes/recipes.module';
import { MealPlansController } from './meal-plans.controller';
import { MealPlansService } from './meal-plans.service';

@Module({
  imports: [RecipesModule, InventoryAuditModule],
  controllers: [MealPlansController],
  providers: [MealPlansService],
  exports: [MealPlansService],
})
export class MealPlansModule {}
