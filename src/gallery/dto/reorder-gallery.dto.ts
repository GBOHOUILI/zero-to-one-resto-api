// src/gallery/dto/reorder-gallery.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class GalleryPositionItem {
  @ApiProperty() id: string;
  @ApiProperty() position: number;
}

export class ReorderGalleryDto {
  @ApiProperty({ type: [GalleryPositionItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GalleryPositionItem)
  items: GalleryPositionItem[];
}
