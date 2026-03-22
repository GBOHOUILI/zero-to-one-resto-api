import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { PaymentsService } from './payments.service';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { CreatePaymentDto } from '../subscriptions/dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';

@ApiTags('SA - Gestion des Flux Financiers')
@ApiBearerAuth('access-token')
@Controller('super-admin/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class SuperAdminPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({
    summary: 'Enregistrer manuellement un paiement (MOMO, Cash, Transfert)',
  })
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.createManualPayment(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lister tous les paiements avec filtres et pagination',
  })
  findAll(@Query() query: PaymentQueryDto) {
    return this.paymentsService.findAll(query);
  }

  @Get('export')
  @ApiOperation({ summary: 'Exporter l’historique des paiements en CSV' })
  async export(@Query() query: PaymentQueryDto, @Res() res: Response) {
    const csv = await this.paymentsService.exportToCsv(query);
    res.header('Content-Type', 'text/csv');
    res.attachment(`export-zero-to-one-${Date.now()}.csv`);
    return res.send(csv);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Mettre à jour le statut d’un paiement (ex: COMPLETED, FAILED)',
  })
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.paymentsService.updateStatus(id, status);
  }
}
