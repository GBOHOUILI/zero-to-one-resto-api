import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class TrackEventDto {
  @IsString()
  @IsNotEmpty()
  restaurant_id: string;

  @IsOptional()
  @IsString()
  page?: string; // ex: 'home', 'menu'

  @IsOptional()
  @IsString()
  session_id?: string; // Pour distinguer les visiteurs uniques
}
