import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateCustomDomainDto {
  @ApiProperty({
    example: 'restau-calavi.bj',
    description: 'Le domaine à ajouter',
  })
  @IsString()
  hostname: string;

  @ApiProperty({
    example: false,
    default: false,
    description: 'Définir comme domaine principal ?',
  })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}
