import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsUrl, MinLength } from 'class-validator';

export class CreateTeamMemberDto {
  @ApiProperty({ example: 'Jean Dupont' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'Chef de Cuisine' })
  @IsString()
  role: string;

  @ApiProperty({
    example: 'Passionné par la gastronomie locale depuis 15 ans.',
  })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/...' })
  @IsString()
  @IsOptional()
  image_url?: string;

  @ApiProperty({ example: 0 })
  @IsInt()
  @IsOptional()
  position?: number;
}
