import { IsOptional, IsString, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class RestaurantQueryDto {
  @IsOptional()
  @IsString()
  search?: string; // Pour chercher dans le nom ou le slug

  @IsOptional()
  @IsEnum(['active', 'incomplete', 'suspended'])
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
