import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

export class CreateIngredientRequestDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  default_unit?: string;

  @IsOptional()
  @IsString()
  unit_kind?: string;

  @IsOptional()
  @IsString()
  base_unit?: string;

  @IsOptional()
  @IsString()
  default_display_unit?: string;

  @IsOptional()
  @IsString()
  image_url?: string;
}

export class UpdateIngredientRequestDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  default_unit?: string;

  @IsOptional()
  @IsString()
  unit_kind?: string;

  @IsOptional()
  @IsString()
  base_unit?: string;

  @IsOptional()
  @IsString()
  default_display_unit?: string;

  @IsOptional()
  @IsString()
  image_url?: string;
}

export class BulkCreateIngredientsRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateIngredientRequestDto)
  ingredients!: CreateIngredientRequestDto[];
}

export type IngredientDto = {
  id: string;
  name: string;
  default_unit: string | null;
  unit_kind: string | null;
  base_unit: string | null;
  default_display_unit: string | null;
  image_url: string | null;
  created_at: number | null;
  updated_at: number | null;
};
