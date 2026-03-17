import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional } from 'class-validator';

export class UpdateMenuCategoryDto {
  @ApiProperty({ example: 'Accompagnements', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 5, required: false })
  @IsInt()
  @IsOptional()
  position?: number;

  @ApiProperty({ example: '🍟', required: false })
  @IsString()
  @IsOptional()
  icon?: string;
}
