// src/restaurants/dto/create-restaurant.dto.ts
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator';

export class CreateRestaurantDto {
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'Email requis' })
  adminEmail: string;

  @IsString()
  @IsNotEmpty({ message: 'Nom du restaurant requis' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Slug requis' })
  slug: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  template?: string;

  @IsString()
  @IsOptional()
  primaryColor?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  seoKeywords?: string[];
}
