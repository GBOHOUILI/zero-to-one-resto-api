import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'eldomoreo@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Pass123456' })
  @IsString()
  password: string;
}
