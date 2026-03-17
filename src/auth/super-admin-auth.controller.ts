import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Roles } from './roles.decorator';
import { Role } from './role.enum';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateAdminDto } from './dto/create-admin.dto';
import { OnboardRestoDto } from './dto/onboard-resto.dto';
import { ApiResponse } from '@nestjs/swagger';
import { RegisterResponseDto } from './dto/auth-response.dto';

@ApiTags('SA - Gestion des Comptes')
@ApiBearerAuth('access-token')
@Roles(Role.SUPER_ADMIN)
@Controller('super-admin/accounts')
export class SuperAdminAuthController {
  constructor(private authService: AuthService) {}

  @Post('create-admin')
  @ApiOperation({ summary: 'Créer un nouveau Super Admin' })
  @ApiResponse({ status: 201, type: RegisterResponseDto }) // ← ICI
  async createAdmin(@Body() dto: CreateAdminDto) {
    return this.authService.register(dto.email, dto.password, Role.SUPER_ADMIN);
  }

  @Post('onboard-restaurant')
  @ApiOperation({ summary: 'Créer un Admin pour un Restaurant spécifique' })
  @ApiResponse({ status: 201, type: RegisterResponseDto }) // ← ICI
  async onboardResto(@Body() dto: OnboardRestoDto) {
    return this.authService.register(
      dto.email,
      dto.password,
      Role.RESTO_ADMIN,
      dto.restaurantId,
    );
  }
}
