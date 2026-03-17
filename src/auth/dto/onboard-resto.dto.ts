import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsUUID, MinLength } from 'class-validator';

export class OnboardRestoDto {
  @ApiProperty({ example: 'manager@sofitel.bj' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'uuid-du-restaurant',
    description: 'Obligatoire pour un Resto Admin',
  })
  @IsUUID()
  @IsNotEmpty()
  restaurantId: string;
}
