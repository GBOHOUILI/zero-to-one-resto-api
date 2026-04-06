import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    /**
     * Crée un client Prisma "étendu" qui injecte le tenantId
     * dans la session PostgreSQL pour la Row Level Security (RLS)
     */
    withTenant(tenantId: string): import("@prisma/client/runtime/library").DynamicClientExtensionThis<import(".prisma/client").Prisma.TypeMap<import("@prisma/client/runtime/library").InternalArgs & {
        result: {};
        model: {};
        query: {};
        client: {};
    }, {}>, import(".prisma/client").Prisma.TypeMapCb<import(".prisma/client").Prisma.PrismaClientOptions>, {
        result: {};
        model: {};
        query: {};
        client: {};
    }>;
}
