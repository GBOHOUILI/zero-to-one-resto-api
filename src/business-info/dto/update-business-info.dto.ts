// update-business-info.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumber,
  IsArray,
  IsString,
  IsInt,
  Min,
} from 'class-validator';

export class UpdateBusinessInfoDto {
  @ApiPropertyOptional({
    description: 'Frais de livraison (XOF)',
    example: 500,
  })
  @IsNumber()
  @IsOptional()
  delivery_fee?: number;

  @ApiPropertyOptional({
    description: 'Services proposés',
    example: ['dine-in', 'takeaway', 'delivery'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  services?: string[];

  @ApiPropertyOptional({
    description: "Capacité d'accueil (couverts)",
    example: 80,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional({
    description: 'Moyens de paiement acceptés',
    example: ['cash', 'wave', 'mtn-money'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  payment_methods?: string[];
}
