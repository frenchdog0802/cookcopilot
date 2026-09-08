import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class RecipeIngredientInputDto {
  @IsOptional()
  @IsUUID()
  ingredient_id?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsNumber()
  quantity!: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateRecipeRequestDto {
  @IsString()
  meal_name!: string;

  @IsOptional()
  @IsUUID()
  folder_id?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientInputDto)
  ingredients?: RecipeIngredientInputDto[];
}

export class UpdateRecipeRequestDto {
  @IsOptional()
  @IsString()
  meal_name?: string;

  @IsOptional()
  @IsUUID()
  folder_id?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientInputDto)
  ingredients?: RecipeIngredientInputDto[];
}

export type RecipeIngredientDto = {
  id: string;
  ingredient_id: string;
  quantity: number;
  unit: string | null;
  note: string | null;
};

export type RecipeDto = {
  id: string;
  meal_name: string;
  folder_id: string | null;
  description: string | null;
  instructions: string | null;
  image_url: string | null;
  image_public_id: string | null;
  ingredients: RecipeIngredientDto[];
  created_at: number | null;
  updated_at: number | null;
};
