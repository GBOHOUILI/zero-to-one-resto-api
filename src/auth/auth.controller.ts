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
import { Role } from './role.enum';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.RESTO_ADMIN) // Endpoint protégé
  @ApiOperation({ summary: 'Créer un nouvel utilisateur (Admin Resto)' })
  async register(
    @Body() registerDto: RegisterDto,
    @GetUser('role') currentUserRole: Role,
  ) {
    const { email, password, role, restaurantId } = registerDto;

    // Bloque la création d'un super admin si l'utilisateur n'est pas SUPER_ADMIN
    if (role === Role.SUPER_ADMIN && currentUserRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Seul un SUPER_ADMIN peut créer un autre SUPER_ADMIN',
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
