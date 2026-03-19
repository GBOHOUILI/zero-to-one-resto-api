import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsUUID,
  IsUrl,
} from 'class-validator';

export class CreateMenuItemDto {
  @ApiProperty({ example: 'ID-DE-LA-CATEGORIE' })
  @IsUUID()
  category_id: string;

  @ApiProperty({ example: 'Wassa-Wassa' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Couscous d’igname traditionnel', required: false })
  @IsOptional()
  @IsString()
  short_description?: string;

  @ApiProperty({ example: 2500 })
  @IsNumber()
  price: number;

  @ApiProperty({
    example: 'https://cloudinary.com/votre-image.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl() // On valide que c'est une URL valide
  image_url?: string;

  @ApiProperty({ example: 'FOOD', default: 'FOOD' })
  @IsString()
  category_type: string;

  @ApiProperty({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  available?: boolean;

  @ApiProperty({ example: 1, default: 0 })
  @IsOptional()
  @IsNumber()
  position?: number;
}
