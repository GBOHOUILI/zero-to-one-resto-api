// src/menus/dto/update-menu-category.dto.ts
import { IsString, IsInt, IsOptional } from 'class-validator';

export class UpdateMenuCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsInt()
  @IsOptional()
  position?: number;

  @IsString()
  @IsOptional()
  icon?: string;
}
