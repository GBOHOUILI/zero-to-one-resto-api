import { Controller, Post, Body, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from './public.decorator';
import { GetUser } from '../common/get-user.decorator';
import { ApiResponse } from '@nestjs/swagger';
import { LoginResponseDto } from './dto/auth-response.dto';

@ApiTags('Auth - Général')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Connexion universelle' })
  @ApiResponse({ status: 200, type: LoginResponseDto }) // ← ICI
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @ApiBearerAuth('access-token')
  @Get('me')
  @ApiOperation({ summary: 'Récupérer mon profil et mon rôle' })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        id: 'uuid',
        email: 'dev@uac.bj',
        role: 'SUPER_ADMIN',
        restaurantId: null,
      },
    },
  })
  async getMe(@GetUser() user: any) {
    return user;
  }
  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Demander un lien de réinitialisation' })
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Confirmer le nouveau mot de passe avec le token' })
  async resetPassword(@Body() resetDto: { token: string; password: string }) {
    return this.authService.resetPassword(resetDto.token, resetDto.password);
  }
}
