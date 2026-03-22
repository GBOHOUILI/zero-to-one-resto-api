import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketDto {
  @ApiProperty({ example: 'Problème avec mon menu digital' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    example: "Bonjour, je n'arrive pas à modifier le prix de mon plat...",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  content: string;
}
