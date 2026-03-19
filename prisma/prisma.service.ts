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
  withTenant(tenantId: string) {
    return this.$extends({
      query: {
        $allModels: {
          async $allOperations({ args, query }) {
            // On enveloppe chaque requête dans une transaction
            return await (this as any).$transaction(async (tx) => {
              // On définit la variable 'app.current_tenant' pour PostgreSQL
              await tx.$executeRawUnsafe(
                `SET LOCAL app.current_tenant = '${tenantId}'`,
              );
              // On exécute la requête Prisma normale
              return query(args);
            });
          },
        },
      },
    });
  }
}
