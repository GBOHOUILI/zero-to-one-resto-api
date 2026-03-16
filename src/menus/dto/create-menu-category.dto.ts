// src/menus/dto/create-menu-category.dto.ts
import { IsString, IsNotEmpty, IsInt, IsOptional } from 'class-validator';

/**
 * DTO pour créer une catégorie de menu (ex: Entrées, Plats principaux, Desserts)
 */
export class CreateMenuCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom de la catégorie est requis' })
  name: string;

  @IsInt()
  @IsOptional()
  position?: number = 0; // ordre d’affichage

  @IsString()
  @IsOptional()
  icon?: string; // emoji ou URL d’icône
}
