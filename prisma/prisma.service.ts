import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Prisma connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('🛑 Prisma disconnected');
  }

  /**
   * Crée un client Prisma "étendu" qui injecte le tenantId
   * dans la session PostgreSQL pour la Row Level Security (RLS)
   */
  // prisma.service.ts
  withTenant(tenantId: string) {
    const baseClient = this;
    return this.$extends({
      query: {
        $allModels: {
          async $allOperations({ args, query }) {
            // On utilise le client de base pour démarrer la transaction
            return await baseClient.$transaction(async (tx) => {
              await tx.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`;
              return query(args);
            });
          },
        },
      },
    });
  }
}
