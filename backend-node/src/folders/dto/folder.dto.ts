import { IsOptional, IsString } from 'class-validator';

export class CreateFolderRequestDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;
}

export class UpdateFolderRequestDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;
}

export type FolderDto = {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  created_at: number | null;
  updated_at: number | null;
};
