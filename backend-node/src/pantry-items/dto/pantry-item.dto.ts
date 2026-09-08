import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

/** Nested payload used by Spring-era / mobile clients. */
export class PantryItemDetailsDto {
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  ingredient_id?: string;
}

/**
 * Dual-backend create payload:
 * - Nest prefers flat { ingredient_id|name, quantity, unit }
 * - Mobile/Spring may send { name, details: { quantity, unit } }
 */
export class CreatePantryItemRequestDto {
  @IsOptional()
  @IsUUID()
  ingredient_id?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PantryItemDetailsDto)
  details?: PantryItemDetailsDto;
}

export class UpdatePantryItemRequestDto {
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PantryItemDetailsDto)
  details?: PantryItemDetailsDto;
}

export class BulkPantryItemsRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePantryItemRequestDto)
  items!: CreatePantryItemRequestDto[];
}

export type PantryItemDto = {
  id: string;
  name: string;
  ingredient_id: string;
  quantity: number;
  unit: string | null;
  notes: string | null;
  unit_kind: string | null;
  base_unit: string | null;
  default_display_unit: string | null;
  created_at: number | null;
  updated_at: number | null;
};
