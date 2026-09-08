import { Type } from 'class-transformer';
import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { MAX_MESSAGE_LENGTH } from '../chat-limits';

export class RecipeContextDto {
  @IsOptional()
  @IsString()
  recipeId?: string;

  @IsOptional()
  @IsString()
  recipeName?: string;
}

export class ChatSendRequestDto {
  @IsString()
  @MaxLength(MAX_MESSAGE_LENGTH)
  message!: string;

  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => RecipeContextDto)
  recipeContext?: RecipeContextDto;
}

export class ChatResumeRequestDto {
  @IsUUID()
  sessionId!: string;

  @IsIn(['approve', 'reject'])
  decision!: 'approve' | 'reject';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class CreateChatSessionDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;
}

export class RenameChatSessionDto {
  @IsString()
  @MaxLength(200)
  title!: string;
}

export type ChatSendResponseDto = {
  type: string;
  message: string;
  data: Record<string, unknown>;
};

export type ChatHistoryMessageDto = {
  id: string;
  role: string;
  content: string;
  createdAt: number | null;
  responseType?: string;
  cardData?: Record<string, unknown>;
};

export type ChatHistoryResponseDto = {
  messages: ChatHistoryMessageDto[];
};

export type ListActionsResponseDto = {
  actions: string[];
  description: string;
};
