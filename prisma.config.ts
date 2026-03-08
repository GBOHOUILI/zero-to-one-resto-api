// prisma.config.ts
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma', // chemin relatif depuis la racine

  migrations: {
    path: 'prisma/migrations', // ou ton chemin habituel
  },

  datasource: {
    url: env('DATABASE_URL'), // utilisé par prisma migrate / db push / introspect
  },
});
