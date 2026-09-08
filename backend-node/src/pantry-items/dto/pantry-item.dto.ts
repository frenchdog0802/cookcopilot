import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class CreatePantryItemRequestDto {
  @IsUUID()
  ingredient_id!: string;

  @IsNumber()
  quantity!: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  notes?: string;
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
}

export class BulkPantryItemsRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePantryItemRequestDto)
  items!: CreatePantryItemRequestDto[];
}

export type PantryItemDto = {
  id: string;
  ingredient_id: string;
  quantity: number;
  unit: string | null;
  notes: string | null;
  created_at: number | null;
  updated_at: number | null;
};
