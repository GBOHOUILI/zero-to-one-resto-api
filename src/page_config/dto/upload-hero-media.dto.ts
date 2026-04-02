import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class UploadHeroMediaDto {
  @ApiProperty({ enum: ['hero_background', 'menu_hero_background'] })
  @IsString()
  @IsIn(['hero_background', 'menu_hero_background'])
  page_slug: string;

  @ApiPropertyOptional({ description: 'Poster/vignette pour les vidéos' })
  @IsString()
  @IsOptional()
  hero_poster_url?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  hero_autoplay?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  hero_muted?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  hero_loop?: boolean;
}
