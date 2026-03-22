import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  // --- GESTION DES PLANS (CRUD) ---
  async createPlan(data: any) {
    return this.prisma.plan.create({ data });
  }

  async getAllPlans() {
    return this.prisma.plan.findMany({ where: { active: true } });
  }

  async updatePlan(id: string, data: any) {
    return this.prisma.plan.update({ where: { id }, data });
  }

  // --- GESTION DES SOUSCRIPTIONS ---
  async createSubscription(dto: CreateSubscriptionDto) {
    const plan = await this.prisma.plan.findUnique({
      where: { id: dto.planId },
    });
    if (!plan) throw new NotFoundException('Plan introuvable');

    // Calcul de la date de fin (30 jours par défaut)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    return this.prisma.subscription.upsert({
      where: { restaurant_id: dto.restaurantId },
      update: {
        plan_id: dto.planId,
        status: 'ACTIVE',
        end_date: endDate,
      },
      create: {
        restaurant_id: dto.restaurantId,
        plan_id: dto.planId,
        start_date: new Date(),
        end_date: endDate,
        status: 'ACTIVE',
      },
    });
  }

  async renewSubscription(id: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('Abonnement introuvable');

    const newEndDate = new Date(sub.end_date);
    newEndDate.setDate(newEndDate.getDate() + 30);

    return this.prisma.subscription.update({
      where: { id },
      data: { end_date: newEndDate, status: 'ACTIVE' },
    });
  }

  // --- CRON JOB SIMULÉ (Vérification expiration) ---
  async checkExpirations() {
    const now = new Date();
    return this.prisma.subscription.updateMany({
      where: {
        end_date: { lt: now },
        status: 'ACTIVE',
      },
      data: { status: 'EXPIRED' },
    });
  }

  async getMySubscription(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { user_id: userId },
      select: { restaurantId: true },
    });
    if (!profile?.restaurantId)
      throw new NotFoundException('Restaurant non trouvé');

    return this.prisma.subscription.findUnique({
      where: { restaurant_id: profile.restaurantId },
      include: { plan: true },
    });
  }

  async initiateRenewal(userId: string) {
    return { message: 'Redirection vers le paiement...', status: 'pending' };
  }

  async createManualPayment(dto: CreatePaymentDto) {
    // 1. Récupérer l'abonnement pour avoir le restaurant_id
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: dto.subscriptionId },
    });

    if (!subscription) throw new NotFoundException('Abonnement introuvable');

    // 2. Enregistrer le paiement
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

    // 3. Update de l'abonnement
    const newEndDate = new Date();
    newEndDate.setDate(newEndDate.getDate() + 30);

    await this.prisma.subscription.update({
      where: { id: dto.subscriptionId },
      data: {
        status: 'ACTIVE',
        end_date: newEndDate,
      },
    });

    return payment;
  }

  async extendAfterPayment(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) throw new NotFoundException('Abonnement introuvable');

    // Calcul de la nouvelle date : on ajoute 30 jours à la date actuelle
    // (ou à la date de fin si elle est encore dans le futur)
    const currentEnd = new Date(subscription.end_date);
    const now = new Date();
    const baseDate = currentEnd > now ? currentEnd : now;

    const newEndDate = new Date(baseDate);
    newEndDate.setDate(newEndDate.getDate() + 30);

    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'ACTIVE',
        end_date: newEndDate,
      },
    });
  }
}
