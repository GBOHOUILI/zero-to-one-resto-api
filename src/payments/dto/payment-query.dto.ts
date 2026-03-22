import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';

export class PaymentQueryDto {
  @IsOptional() @IsString() restaurantId?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() page?: number;
  @IsOptional() limit?: number;
}
