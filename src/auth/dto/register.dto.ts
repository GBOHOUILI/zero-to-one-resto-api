// src/auth/dto/register.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
} from 'class-validator';
import { Role } from '../role.enum';

export class RegisterDto {
  @ApiProperty({ example: 'eldomoreo@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Pass123456' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: Role, example: Role.RESTO_ADMIN })
  @IsEnum(Role)
  role: Role; // ← Utilisation de l'enum Role en majuscules

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  restaurantId?: string;
}
