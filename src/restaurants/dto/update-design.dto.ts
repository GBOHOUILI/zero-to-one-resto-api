import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsHexColor,
  IsBoolean,
  IsIn,
} from 'class-validator';

export class UpdateDesignDto {
  @ApiProperty({ example: '#FF5733', description: 'Couleur principale' })
  @IsHexColor()
  @IsOptional()
  primary_color?: string;

  @ApiProperty({ example: '#FFFFFF', description: 'Couleur secondaire' })
  @IsHexColor()
  @IsOptional()
  secondary_color?: string;

  @ApiProperty({ example: 'Poppins', description: 'Famille de police' })
  @IsString()
  @IsOptional()
  font_family?: string;

  @ApiProperty({
    example: 'default',
    enum: ['default', 'classic', 'modern', 'minimalist', 'template1', 'template2', 'template3', 'template4'],
    description: 'Template de design',
  })
  @IsIn(['default', 'classic', 'modern', 'minimalist', 'template1', 'template2', 'template3', 'template4'])
  @IsOptional()
  template?: string;

  @ApiProperty({ example: true, description: 'Activer le mode sombre' })
  @IsBoolean()
  @IsOptional()
  dark_mode?: boolean;
}