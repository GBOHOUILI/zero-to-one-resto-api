import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsArray,
  IsBoolean,
  IsIn,
} from 'class-validator';

export class UpdatePageConfigDto {
  @ApiPropertyOptional() @IsString() @IsOptional() page_title?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() page_subtitle?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() page_text?: string;

  @ApiPropertyOptional({ enum: ['image', 'video'] })
  @IsString()
  @IsIn(['image', 'video'])
  @IsOptional()
  hero_media_type?: string;

  @ApiPropertyOptional() @IsString() @IsOptional() hero_media_url?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() hero_poster_url?: string;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() hero_autoplay?: boolean;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() hero_muted?: boolean;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() hero_loop?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  page_images?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  page_videos?: string[];
}
