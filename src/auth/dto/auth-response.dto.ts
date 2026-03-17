import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../role.enum';

export class LoginResponseDto {
  @ApiProperty({ example: 'Connexion réussie' })
  message: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  access_token: string;

  @ApiProperty({
    example: {
      id: 'uac-user-uuid',
      email: 'dev@zero-to-one.bj',
      role: Role.RESTO_ADMIN,
      restaurantId: 'resto-uuid-123',
    },
  })
  user: any;
}

export class RegisterResponseDto {
  @ApiProperty({ example: 'Utilisateur créé avec succès' })
  message: string;

  @ApiProperty({ example: 'uac-user-uuid' })
  userId: string;

  @ApiProperty({ example: Role.RESTO_ADMIN, enum: Role })
  role: Role;

  @ApiProperty({ example: 'resto-uuid-123', nullable: true })
  restaurantId: string;
}
