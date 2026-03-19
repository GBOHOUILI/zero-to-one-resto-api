import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsBoolean } from 'class-validator';

export class UpdatePageConfigDto {
  @IsString() @IsOptional() page_title?: string;
  @IsString() @IsOptional() page_subtitle?: string;
  @IsString() @IsOptional() page_text?: string;

  // Configuration Média Hero
  @IsString() @IsOptional() hero_media_type?: string; // 'image' | 'video'
  @IsString() @IsOptional() hero_media_url?: string;
  @IsBoolean() @IsOptional() hero_autoplay?: boolean;

  // Tableaux (Prisma gère ça en String[])
  @IsArray() @IsString({ each: true }) @IsOptional() page_images?: string[];
  @IsArray() @IsString({ each: true }) @IsOptional() page_videos?: string[];
}
