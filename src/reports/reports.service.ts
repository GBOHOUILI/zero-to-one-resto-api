import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // Création d'un signalement (Resto Admin)
  async createReport(restaurantId: string, userId: string, data: any) {
    return this.prisma.report.create({
      data: {
        ...data,
        restaurant_id: restaurantId,
        reporter_id: userId,
      },
    });
  }

  // Liste globale pour le Super Admin
  async getAllReports() {
    return this.prisma.report.findMany({
      include: {
        restaurant: { select: { name: true, slug: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // Mise à jour du statut (Super Admin)
  async updateReportStatus(id: string, status: string, priority?: string) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Signalement introuvable');

    return this.prisma.report.update({
      where: { id },
      data: {
        status,
        ...(priority && { priority }),
        updated_at: new Date(),
      },
    });
  }
}
