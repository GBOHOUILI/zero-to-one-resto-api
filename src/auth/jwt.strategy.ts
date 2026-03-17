// src/auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  restaurantId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret || 'eero-to-one-secret-key',
    });
  }

  async validate(payload: JwtPayload) {
    // Normalisation du rôle pour éviter les erreurs de casse
    const role = payload.role?.toUpperCase();

    return {
      id: payload.sub,
      email: payload.email,
      role,
      restaurantId: payload.restaurantId || null,
    };
  }
}
