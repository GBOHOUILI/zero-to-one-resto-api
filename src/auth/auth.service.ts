// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Role } from './role.enum';
import { MailService } from '../mail/mail.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  // Utilise Role comme type pour le rôle
  async register(
    email: string,
    password: string,
    role: Role,
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
      data: { email, password: hashed, role }, // Role enum utilisé ici
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
      throw new UnauthorizedException({ message: 'Utilisateur non trouvé' });
    }

    if (!user.password) {
      throw new UnauthorizedException({ message: 'Le compte est invalide' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new UnauthorizedException({ message: 'Mot de passe incorrect' });
    }

    const payload = {
      sub: user.id,
      role: user.role as Role, // assure TypeScript que c’est un Role
      restaurantId: user.profile?.restaurantId ?? null,
    };

    return {
      message: 'Connexion réussie',
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role as Role,
        restaurantId: user.profile?.restaurantId ?? null,
      },
    };
  }
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Pour la sécurité, on ne dit pas si l'email existe ou pas
    if (!user) return { message: 'Si cet email existe, un lien a été envoyé.' };

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1); // Expire dans 1h

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        reset_token: token,
        reset_token_expiry: expiry,
      },
    });

    await this.mailService.sendResetPasswordEmail(user.email, token);

    return { message: 'Si cet email existe, un lien a été envoyé.' };
  }

  // 2. Logique de changement effectif
  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        reset_token: token,
        reset_token_expiry: { gte: new Date() },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Token invalide ou expiré');
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        reset_token: null,
        reset_token_expiry: null,
      },
    });

    return { message: 'Mot de passe mis à jour avec succès.' };
  }
}
