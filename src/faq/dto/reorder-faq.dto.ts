// src/faq/dto/reorder-faq.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class FaqPositionItem {
  @ApiProperty() id: string;
  @ApiProperty() position: number;
}

export class ReorderFaqDto {
  @ApiProperty({ type: [FaqPositionItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FaqPositionItem)
  items: FaqPositionItem[];
}
