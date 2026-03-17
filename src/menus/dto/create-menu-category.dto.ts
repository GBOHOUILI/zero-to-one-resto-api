import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsOptional } from 'class-validator';

/**
 * DTO pour créer une catégorie de menu (ex: Entrées, Plats principaux, Desserts)
 */
export class CreateMenuCategoryDto {
  @ApiProperty({
    example: 'Plats de Résistance',
    description: 'Le nom de la catégorie qui sera affiché sur le menu digital',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le nom de la catégorie est requis' })
  name: string;

  @ApiProperty({
    example: 2,
    description: 'Ordre d’affichage (plus petit = en haut)',
    default: 0,
    required: false,
  })
  @IsInt()
  @IsOptional()
  position?: number = 0;

  @ApiProperty({
    example: '🥘',
    description: 'Emoji ou identifiant d’icône pour illustrer la catégorie',
    required: false,
  })
  @IsString()
  @IsOptional()
  icon?: string;
}
