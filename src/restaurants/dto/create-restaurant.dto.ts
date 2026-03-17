import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({
    example: 'saveurs-du-benin.bj',
    description: 'Nom de domaine personnalisé',
  })
  @IsString()
  @IsNotEmpty()
  hostname: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  verified?: boolean;
}

export class CreateRestaurantDto {
  @ApiProperty({
    example: 'manager@saveurs-benin.com',
    description: 'Email de l’administrateur du resto',
  })
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'Email requis' })
  adminEmail: string;

  @ApiProperty({ example: 'Saveurs du Bénin', description: 'Nom commercial' })
  @IsString()
  @IsNotEmpty({ message: 'Nom du restaurant requis' })
  name: string;

  @ApiProperty({
    example: 'saveurs-benin',
    description: 'Slug pour l’URL (ex: saveurs-benin.zero-to-one.bj)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Slug requis' })
  slug: string;

  @ApiProperty({ example: 'Africain Moderne', required: false })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({
    example: 'premium-gold',
    description: 'Identifiant du template UI',
    required: false,
  })
  @IsString()
  @IsOptional()
  template?: string;

  @ApiProperty({
    example: '#E67E22',
    description: 'Couleur principale de la marque',
    required: false,
  })
  @IsString()
  @IsOptional()
  primaryColor?: string;

  @ApiProperty({
    example: 'XOF',
    default: 'XOF',
    description: 'Devise utilisée (CFA)',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ type: [DomainDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DomainDto)
  @IsOptional()
  customDomains?: DomainDto[];

  @ApiProperty({
    example: ['Wassa-Wassa', 'Cotonou', 'Livraison Rapide'],
    isArray: true,
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  seoKeywords?: string[];
}
