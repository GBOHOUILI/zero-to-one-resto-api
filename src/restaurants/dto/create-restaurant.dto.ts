import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

class DomainDto {
  @IsString()
  @IsNotEmpty()
  hostname: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @IsBoolean()
  @IsOptional()
  verified?: boolean;
}

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
  @ValidateNested({ each: true })
  @Type(() => DomainDto)
  @IsOptional()
  customDomains?: DomainDto[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  seoKeywords?: string[];
}
