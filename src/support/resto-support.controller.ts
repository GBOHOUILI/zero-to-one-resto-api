import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ReplyMessageDto } from './dto/reply-message.dto';

@ApiTags('Resto - Support')
@ApiBearerAuth('access-token')
@Controller('my-restaurant/support')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.RESTO_ADMIN)
export class RestoSupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @ApiOperation({ summary: 'Ouvrir un nouveau ticket de support' })
  create(@Body() dto: CreateTicketDto, @Req() req) {
    return this.supportService.createTicket(
      req.user.restaurantId,
      req.user.userId,
      dto,
    );
  }

  @Get('tickets')
  @ApiOperation({ summary: 'Voir mes tickets de support' })
  myTickets(@Req() req) {
    return this.supportService.getRestaurantTickets(req.user.restaurantId);
  }

  @Post('tickets/:id/reply')
  @ApiOperation({ summary: "Répondre dans la discussion d'un ticket" })
  reply(@Param('id') id: string, @Body() dto: ReplyMessageDto, @Req() req) {
    return this.supportService.addMessage(
      id,
      dto.content,
      req.user.userId,
      false,
    );
  }
}
