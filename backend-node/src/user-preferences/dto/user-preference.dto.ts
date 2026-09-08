import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateUserPreferenceRequestDto {
  @IsOptional()
  @IsString()
  householdNotes?: string;

  @IsOptional()
  @IsString()
  measurementUnit?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dislikes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  likes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dietaryRestrictions?: string[];
}

export type UserPreferenceDto = {
  id: string;
  householdNotes: string | null;
  measurementUnit: string | null;
  notes: string | null;
  allergies: string[];
  dislikes: string[];
  likes: string[];
  dietaryRestrictions: string[];
};
