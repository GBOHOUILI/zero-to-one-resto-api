import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(
    email: string,
    password: string,
    role: 'super_admin' | 'resto_admin',
    restaurantId?: string,
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new UnauthorizedException({ message: 'Email déjà utilisé' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: { email, password: hashed, role },
      include: { profile: true },
    });

    await this.prisma.profile.create({
      data: {
        id: user.id,
        user_id: user.id,
        restaurantId: restaurantId ?? null,
      },
    });

    return {
      message: 'Utilisateur créé avec succès',
      userId: user.id,
      role: user.role,
      restaurantId: restaurantId ?? null,
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: { select: { restaurantId: true } } },
    });

    if (!user) {
      // Aucun utilisateur trouvé avec cet email
      throw new UnauthorizedException({ message: 'Utilisateur non trouvé' });
    }

    if (!user.password) {
      // Cas rare : utilisateur sans mot de passe
      throw new UnauthorizedException({ message: 'Le compte est invalide' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      // Mot de passe incorrect
      throw new UnauthorizedException({ message: 'Mot de passe incorrect' });
    }

    const payload = {
      sub: user.id,
      role: user.role,
      restaurantId: user.profile?.restaurantId ?? null,
    };

    return {
      message: 'Connexion réussie',
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        restaurantId: user.profile?.restaurantId ?? null,
      },
    };
  }
}
