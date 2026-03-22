import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreatePaymentDto } from '../subscriptions/dto/create-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private subscriptionService: SubscriptionsService,
  ) {}

  /**
   * Création manuelle (Super Admin)
   */
  async createManualPayment(dto: CreatePaymentDto) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: dto.subscriptionId },
    });

    if (!subscription) throw new NotFoundException('Abonnement introuvable');

    const payment = await this.prisma.payment.create({
      data: {
        subscription_id: dto.subscriptionId,
        restaurant_id: subscription.restaurant_id,
        amount: dto.amount,
        method: dto.method,
        transaction_ref: dto.transactionRef,
        status: 'COMPLETED',
        paid_at: new Date(),
      },
    });

    // On prolonge l'abonnement automatiquement
    await this.subscriptionService.extendAfterPayment(dto.subscriptionId);

    return payment;
  }

  /**
   * Lecture avec filtres et pagination
   */
  async findAll(query: PaymentQueryDto) {
    const {
      restaurantId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (restaurantId) where.restaurant_id = restaurantId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.paid_at = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: Number(limit),
        include: { restaurant: { select: { name: true } } },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }

  /**
   * Export CSV simple
   */
  async exportToCsv(query: PaymentQueryDto) {
    const { data } = await this.findAll({ ...query, limit: 1000 });

    const header = 'ID;Restaurant;Montant;Methode;Statut;Date\n';
    const rows = data
      .map(
        (p) =>
          `${p.id};${p.restaurant?.name};${p.amount};${p.method};${p.status};${p.paid_at?.toISOString()}`,
      )
      .join('\n');

    return header + rows;
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.payment.update({
      where: { id },
      data: { status },
    });
  }
}
