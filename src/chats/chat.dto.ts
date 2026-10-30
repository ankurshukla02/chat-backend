import { Type } from 'class-transformer';
import {
  IsUUID,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class CreateChatDto {
  @IsUUID()
  userAId!: string;

  @IsUUID()
  userBId!: string;
}

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  text!: string;
}

export class ReadMessageDto {
  @IsUUID()
  userId!: string;
}

export class LastSeenDto {
  @IsUUID()
  userId!: string;

  @IsString()
  messageId!: string;
}

export class MessageQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;

  @IsOptional()
  @IsString()
  cursor?: string;
}
