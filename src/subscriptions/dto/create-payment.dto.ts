import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
} from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ example: 'sub_uuid_123' })
  @IsString()
  @IsNotEmpty()
  subscriptionId: string;

  @ApiProperty({ example: 15000 })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    example: 'CASH',
    enum: ['CASH', 'MTN_MOMO', 'MOOV_MONEY', 'TRANSFER'],
  })
  @IsString()
  @IsNotEmpty()
  method: string;

  @ApiProperty({
    example: 'TXN-987654',
    description: 'ID de transaction ou ref reçu de MoMo',
  })
  @IsString()
  @IsOptional()
  transactionRef?: string;
}
