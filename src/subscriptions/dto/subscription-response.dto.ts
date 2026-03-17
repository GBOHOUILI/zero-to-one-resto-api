import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionResponseDto {
  @ApiProperty({ example: 'uuid-sub-123' })
  id: string;

  @ApiProperty({ example: '2026-03-17T00:00:00Z' })
  start_date: Date;

  @ApiProperty({ example: '2026-04-16T00:00:00Z' })
  end_date: Date;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({
    example: { name: 'Plan Premium', price: 15000, currency: 'XOF' },
  })
  plan: any;
}
