import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
  IsPositive,
  IsOptional,
  IsPhoneNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty({ example: 'item-uuid-123', description: 'ID du plat' })
  @IsString()
  @IsNotEmpty()
  item_id: string;

  @ApiProperty({ example: 'Poulet braisé', description: 'Nom du plat (snapshot)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 3500, description: 'Prix unitaire au moment de la commande' })
  @IsNumber()
  @IsPositive()
  unit_price: number;

  @ApiProperty({ example: 2, description: 'Quantité commandée' })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'resto-uuid-abc', description: 'ID du restaurant' })
  @IsString()
  @IsNotEmpty()
  restaurant_id: string;

  @ApiProperty({ type: [OrderItemDto], description: 'Liste des plats commandés' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiPropertyOptional({ example: '+22961000000', description: 'Numéro WhatsApp du client' })
  @IsOptional()
  @IsString()
  customer_phone?: string;

  @ApiPropertyOptional({ example: 'Table 5', description: 'Note ou numéro de table' })
  @IsOptional()
  @IsString()
  note?: string;
}
