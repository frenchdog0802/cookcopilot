import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ok } from '../common/api-response';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateMealPlanRequestDto,
  UpdateMealPlanRequestDto,
} from './dto/meal-plan.dto';
import { MealPlansService } from './meal-plans.service';

@Controller('api/meal-plan')
export class MealPlansController {
  constructor(private readonly mealPlansService: MealPlansService) {}

  @Get()
  async list(@CurrentUser() userId: string) {
    const mealPlans = await this.mealPlansService.listMealPlans(userId);
    return ok({ mealPlans });
  }

  @Get('pending-confirm')
  async getPendingConfirm(@CurrentUser() userId: string) {
    const mealPlans =
      await this.mealPlansService.getPendingConfirmations(userId);
    return ok({ mealPlans });
  }

  @Get(':id')
  async getById(@CurrentUser() userId: string, @Param('id') id: string) {
    const mealPlan = await this.mealPlansService.getMealPlanById(userId, id);
    return ok({ mealPlan });
  }

  @Post()
  async create(
    @CurrentUser() userId: string,
    @Body() dto: CreateMealPlanRequestDto,
  ) {
    const result = await this.mealPlansService.createMealPlan(userId, dto);
    return ok({
      mealPlan: result.mealPlan,
      notEnoughItems: result.notEnoughItems,
    });
  }

  @Post(':id/confirm')
  async confirm(@Param('id') id: string, @CurrentUser() userId: string) {
    const result = await this.mealPlansService.confirmMealPlan(userId, id);
    return ok({
      mealPlan: result.mealPlan,
      shortages: result.shortages,
      deducted: result.deducted,
      already_confirmed: result.already_confirmed,
    });
  }

  @Post(':id/skip')
  async skip(@Param('id') id: string, @CurrentUser() userId: string) {
    const result = await this.mealPlansService.skipMealPlan(userId, id);
    return ok({
      mealPlan: result.mealPlan,
      already_skipped: result.already_skipped,
    });
  }

  @Put(':id')
  async update(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMealPlanRequestDto,
  ) {
    const mealPlan = await this.mealPlansService.updateMealPlan(
      userId,
      id,
      dto,
    );
    return ok({ mealPlan });
  }

  @Delete(':id')
  async remove(@CurrentUser() userId: string, @Param('id') id: string) {
    const result = await this.mealPlansService.deleteMealPlan(userId, id);
    return ok(result);
  }
}
