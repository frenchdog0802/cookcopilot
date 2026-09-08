import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateMealPlanRequestDto {
  @IsUUID()
  recipe_id!: string;

  @IsOptional()
  @IsString()
  meal_type?: string;

  @IsOptional()
  @IsString()
  serving_date?: string;
}

export class UpdateMealPlanRequestDto {
  @IsOptional()
  @IsUUID()
  recipe_id?: string;

  @IsOptional()
  @IsString()
  meal_type?: string;

  @IsOptional()
  @IsString()
  serving_date?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export type MealPlanImageDto = {
  url: string;
  public_id: string | null;
};

export type MealPlanDto = {
  id: string;
  recipe_id: string;
  meal_type: string | null;
  serving_date: string | null;
  status: string;
  meal_name: string | null;
  image_url: MealPlanImageDto | null;
};

export type NotEnoughItemDto = {
  ingredient_id: string;
  name: string;
  required_quantity: number;
  available_quantity: number;
  unit: string;
};

export type CreateMealPlanResponseDto = {
  mealPlan: MealPlanDto;
  notEnoughItems?: NotEnoughItemDto[];
};

export type MealPlanShortageDto = {
  ingredient_id: string;
  name: string;
  needed: number;
  available: number;
  unit: string;
};

export type MealPlanDeductedDto = {
  ingredient_id: string;
  name: string;
  deducted: number;
  previous_quantity: number;
  new_quantity: number;
  unit: string;
};

export type ConfirmMealPlanResponseDto = {
  mealPlan: MealPlanDto;
  shortages: MealPlanShortageDto[];
  deducted: MealPlanDeductedDto[];
  already_confirmed: boolean;
};

export type SkipMealPlanResponseDto = {
  mealPlan: MealPlanDto;
  already_skipped: boolean;
};
