import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CategoryOrderDto {
  @IsUUID()
  id: string;

  @IsInt()
  position: number;
}

export class ReorderCategoriesDto {
  @ApiProperty({
    type: [CategoryOrderDto],
    example: [
      { id: 'uuid-1', position: 0 },
      { id: 'uuid-2', position: 1 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryOrderDto)
  categories: CategoryOrderDto[];
}
