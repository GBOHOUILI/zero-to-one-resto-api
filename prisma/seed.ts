// prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Pass123456', 10);

  // 1. Création de TOI en tant que Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'eldomoreogbohouili@gmail.com' },
    update: {},
    create: {
      email: 'eldomoreogbohouili@gmail.com',
      password,
      role: Role.SUPER_ADMIN,
    },
  });

  console.log('✅ Super Admin créé :', superAdmin.email);

  // 2. Création d'un Restaurant de test pour "Zero to One"
  const testResto = await prisma.restaurant.upsert({
    where: { slug: 'test-resto' },
    update: {},
    create: {
      name: 'Le Gout du Bénin',
      slug: 'test-resto',
      type: 'Africain Moderne',
      template: 'premium-gold',
      primary_color: '#E67E22',
      currency: 'XOF',
      status: 'active',
      owner_id: superAdmin.id,
      custom_domains: {
        create: [
          {
            hostname: 'test.local',
            isPrimary: true,
            verified: true,
          },
        ],
      },
    },
  });

  console.log('✅ Restaurant de test créé : test-resto (test.local)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
