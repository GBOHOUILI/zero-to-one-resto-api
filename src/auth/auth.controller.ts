// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { GetUser } from '../common/get-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ────────────────────────────────────────────────
  // REGISTER → Réservé aux SUPER_ADMIN uniquement
  // ────────────────────────────────────────────────
  @Post('register')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  async register(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('role') role: 'super_admin' | 'resto_admin',
    @GetUser('id') currentUserId: string,
    @Body('restaurantId') restaurantId?: string,
  ) {
    // Sécurité supplémentaire
    if (role === 'super_admin') {
      throw new ForbiddenException(
        'Seul un super admin peut créer un autre super admin',
      );
    }

    return this.authService.register(email, password, role, restaurantId);
  }

  @Post('login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.authService.login(email, password);
  }
}
