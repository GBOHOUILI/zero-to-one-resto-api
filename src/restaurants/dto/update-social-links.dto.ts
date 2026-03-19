import { IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSocialLinksDto {
  @ApiProperty({ example: 'https://facebook.com/monresto', required: false })
  @IsUrl()
  @IsOptional()
  facebook?: string;

  @ApiProperty({ example: 'https://instagram.com/monresto', required: false })
  @IsUrl()
  @IsOptional()
  instagram?: string;

  @ApiProperty({ example: 'https://tiktok.com/@monresto', required: false })
  @IsUrl()
  @IsOptional()
  tiktok?: string;

  @ApiProperty({ example: 'https://twitter.com/monresto', required: false })
  @IsUrl()
  @IsOptional()
  twitter?: string;
}
