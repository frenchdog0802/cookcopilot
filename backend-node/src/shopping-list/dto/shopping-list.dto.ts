import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class CreateShoppingListItemRequestDto {
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
  @IsBoolean()
  checked?: boolean;
}

export class UpdateShoppingListItemRequestDto {
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsBoolean()
  checked?: boolean;
}

export class BulkShoppingListItemsRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateShoppingListItemRequestDto)
  items!: CreateShoppingListItemRequestDto[];
}

export type ShoppingListItemDto = {
  id: string;
  name: string;
  ingredient_id: string;
  quantity: number | null;
  unit: string | null;
  checked: boolean;
  has_been_added_to_pantry: boolean;
  unit_kind: string | null;
  base_unit: string | null;
  default_display_unit: string | null;
  created_at: number | null;
  updated_at: number | null;
};
