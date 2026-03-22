import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReplyMessageDto } from './dto/reply-message.dto';

@ApiTags('SA - Support Client')
@ApiBearerAuth('access-token')
@Controller('super-admin/support')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class SuperAdminSupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('tickets')
  @ApiOperation({ summary: 'Lister tous les tickets de la plateforme' })
  findAll() {
    return this.supportService.getAllTickets();
  }

  @Patch('tickets/:id/reply')
  @ApiOperation({ summary: 'Répondre à un ticket client' })
  reply(@Param('id') id: string, @Body() dto: ReplyMessageDto, @Req() req) {
    return this.supportService.addMessage(
      id,
      dto.content,
      req.user.userId,
      true,
    );
  }
}
