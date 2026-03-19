import { IsString, IsInt, Min, Max, Matches, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOpeningHourDto {
  @ApiProperty({
    example: 1,
    description: '0=Dimanche, 1=Lundi, ..., 6=Samedi',
  })
  @IsInt()
  @Min(0)
  @Max(6)
  day_of_week: number;

  @ApiProperty({ example: '08:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):?([0-5]\d)$/, { message: 'Format HH:mm requis' })
  open_time: string;

  @ApiProperty({ example: '22:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):?([0-5]\d)$/, { message: 'Format HH:mm requis' })
  close_time: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  is_closed: boolean;
}
