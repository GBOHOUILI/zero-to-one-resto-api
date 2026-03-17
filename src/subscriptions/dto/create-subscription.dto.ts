import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty({
    example: '28c6e7b5-6918-4ea6-b108-a4dacf913cd7',
    description: 'ID du restaurant',
  })
  @IsUUID()
  restaurantId: string;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6...',
    description: 'ID du plan tarifaire choisi',
  })
  @IsUUID()
  planId: string;

  @ApiProperty({
    example: 'active',
    enum: ['active', 'past_due', 'canceled'],
    default: 'active',
  })
  @IsString()
  @IsOptional()
  @IsEnum(['active', 'past_due', 'canceled'])
  status?: string;
}
