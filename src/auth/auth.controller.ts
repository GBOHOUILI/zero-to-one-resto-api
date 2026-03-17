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
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
@Controller('auth')
@ApiTags('Authentication') // Pour grouper dans Swagger
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Créer un nouvel utilisateur (Admin Resto)' })
  async register(
    @Body() registerDto: RegisterDto,
    @GetUser('id') currentUserId: string,
  ) {
    const { email, password, role, restaurantId } = registerDto;

    if (role === 'super_admin') {
      throw new ForbiddenException(
        'Seul un super admin peut créer un autre super admin',
      );
    }

    return this.authService.register(email, password, role, restaurantId);
  }

  @Post('login')
  @ApiOperation({ summary: 'Connexion utilisateur' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }
}
