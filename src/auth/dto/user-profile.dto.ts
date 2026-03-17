import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({ example: 'uuid-789' })
  id: string;

  @ApiProperty({ example: 'senior.dev@uac.bj' })
  email: string;

  @ApiProperty({ example: 'RESTO_ADMIN', enum: ['SUPER_ADMIN', 'RESTO_ADMIN'] })
  role: string;

  @ApiProperty({
    example: {
      id: 'uuid-resto-456',
      name: 'La pirogue de Save',
      slug: 'la-pirogue',
    },
    nullable: true,
    description: 'Infos du restaurant si le user est un RESTO_ADMIN',
  })
  restaurant?: any;
}
