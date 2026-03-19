import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

class UpdateDomainDto {
  @ApiProperty({ example: 'nouvelle-adresse.bj', required: false })
  @IsString()
  @IsOptional()
  hostname?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  verified?: boolean;
}

export class UpdateRestaurantDto {
  @ApiProperty({ example: 'Saveurs du Bénin (V2)', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Le meilleur de Calavi', required: false })
  @IsString()
  @IsOptional()
  slogan?: string;

  @ApiProperty({ example: 'https://...', required: false })
  @IsString()
  @IsOptional()
  logo_url?: string;

  @ApiProperty({ example: 'Gastronomie', required: false })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ example: 'minimalist-dark', required: false })
  @IsString()
  @IsOptional()
  template?: string;

  @ApiProperty({ example: '#2ECC71', required: false })
  @IsString()
  @IsOptional()
  primary_color?: string;

  @ApiProperty({ example: 'XOF', required: false })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({
    example: ['Gastronomie', 'Calavi'],
    isArray: true,
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  seo_keywords?: string[];
}
