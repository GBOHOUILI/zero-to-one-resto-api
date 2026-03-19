import { IsString, IsOptional, IsEmail, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateContactDto {
  @ApiProperty({ example: '+22990000000', required: false })
  @IsString()
  @IsOptional()
  whatsapp?: string;

  @ApiProperty({ example: '+22921000000', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'contact@monresto.bj', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'Abomey-Calavi, Rue 12', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'https://maps.google.com/...', required: false })
  @IsUrl()
  @IsOptional()
  google_maps_url?: string;
}
