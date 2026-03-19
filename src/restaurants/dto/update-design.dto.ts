import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsHexColor, IsIn } from 'class-validator';

export class UpdateDesignDto {
  @ApiProperty({ example: '#FF5733' })
  @IsHexColor()
  @IsOptional()
  primary_color?: string;

  @ApiProperty({ example: '#FFFFFF' })
  @IsHexColor()
  @IsOptional()
  secondary_color?: string;

  @ApiProperty({ example: 'Poppins' })
  @IsString()
  @IsOptional()
  font_family?: string;

  @ApiProperty({ example: 'modern', enum: ['classic', 'modern', 'minimalist'] })
  @IsString()
  @IsOptional()
  template?: string;

  @ApiProperty({ example: true })
  @IsOptional()
  dark_mode?: boolean;
}
