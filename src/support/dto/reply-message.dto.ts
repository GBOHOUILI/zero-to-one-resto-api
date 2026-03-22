import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReplyMessageDto {
  @ApiProperty({ example: 'Nous avons bien pris en compte votre demande.' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
