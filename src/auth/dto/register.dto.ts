import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'eldomoreo@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Pass123456' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: ['super_admin', 'resto_admin'], example: 'resto_admin' })
  @IsEnum(['super_admin', 'resto_admin'])
  role: 'super_admin' | 'resto_admin';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  restaurantId?: string;
}
