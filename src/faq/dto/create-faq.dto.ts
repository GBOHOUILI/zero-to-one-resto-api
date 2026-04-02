// src/faq/dto/create-faq.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class CreateFaqDto {
  @ApiProperty() @IsString() @IsNotEmpty() question: string;
  @ApiProperty() @IsString() @IsNotEmpty() answer: string;
  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  position?: number;
}
