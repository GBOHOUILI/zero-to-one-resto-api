/**
 * prisma/seed.ts
 * Script de seed pour données de démonstration Zero-To-One
 * Usage : npx ts-node prisma/seed.ts
 *        (ou via package.json: npm run db:seed)
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed...\n');

  // 1. Super Admin
  const superAdminEmail = 'admin@zero-to-one.bj';
  const superAdminPassword = await bcrypt.hash('SuperAdmin123!', 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {},
    create: {
      email: superAdminEmail,
      password: superAdminPassword,
      role: 'SUPER_ADMIN',
    },
  });
  await prisma.profile.upsert({
    where: { user_id: superAdmin.id },
    update: {},
    create: { id: superAdmin.id, user_id: superAdmin.id },
  });
  console.log(`✅ Super Admin : ${superAdminEmail}`);

  // 2. Restaurant démo : Chez Maman
  const restoAdminEmail = 'chezmaman@demo.bj';
  const restoAdminPassword = await bcrypt.hash('RestoPass123!', 12);

  const restoUser = await prisma.user.upsert({
    where: { email: restoAdminEmail },
    update: {},
    create: {
      email: restoAdminEmail,
      password: restoAdminPassword,
      role: 'RESTO_ADMIN',
    },
  });

  const restaurant = await prisma.restaurant.upsert({
    where: { slug: 'chez-maman' },
    update: {},
    create: {
      slug: 'chez-maman',
      name: 'Chez Maman',
      slogan: 'La cuisine de chez nous, revisitée',
      type: 'africain',
      template: 'default',
      primary_color: '#e8632a',
      secondary_color: '#1a1a2e',
      font_family: 'Inter',
      currency: 'FCFA',
      status: 'active',
      show_images: true,
      dark_mode: false,
      seo_keywords: ['restaurant', 'cuisine africaine', 'Cotonou', 'livraison'],
      owner_id: restoUser.id,
    },
  });

  await prisma.profile.upsert({
    where: { user_id: restoUser.id },
    update: { restaurantId: restaurant.id },
    create: {
      id: restoUser.id,
      user_id: restoUser.id,
      restaurantId: restaurant.id,
    },
  });

  // Contact & WhatsApp
  await prisma.contact.upsert({
    where: { restaurant_id: restaurant.id },
    update: {},
    create: {
      restaurant_id: restaurant.id,
      whatsapp: '+22961000001',
      phone: '+22921000001',
      email: 'contact@chezmaman.bj',
      address: 'Quartier Cadjehoun, Cotonou',
      google_maps_url: 'https://maps.google.com/?q=Cadjehoun+Cotonou',
    },
  });

  // Horaires d'ouverture
  const hours = [
    {
      day_of_week: 1,
      open_time: '08:00',
      close_time: '22:00',
      is_closed: false,
    },
    {
      day_of_week: 2,
      open_time: '08:00',
      close_time: '22:00',
      is_closed: false,
    },
    {
      day_of_week: 3,
      open_time: '08:00',
      close_time: '22:00',
      is_closed: false,
    },
    {
      day_of_week: 4,
      open_time: '08:00',
      close_time: '22:00',
      is_closed: false,
    },
    {
      day_of_week: 5,
      open_time: '08:00',
      close_time: '23:00',
      is_closed: false,
    },
    {
      day_of_week: 6,
      open_time: '09:00',
      close_time: '23:00',
      is_closed: false,
    },
    {
      day_of_week: 0,
      open_time: '10:00',
      close_time: '20:00',
      is_closed: false,
    },
  ];
  for (const h of hours) {
    await prisma.openingHour.upsert({
      where: {
        id: `seed-hour-${restaurant.id}-${h.day_of_week}`,
      },
      update: {},
      create: {
        id: `seed-hour-${restaurant.id}-${h.day_of_week}`,
        restaurant_id: restaurant.id,
        ...h,
      },
    });
  }

  // Liens sociaux
  await prisma.socialLink.upsert({
    where: { restaurant_id: restaurant.id },
    update: {},
    create: {
      restaurant_id: restaurant.id,
      facebook: 'https://facebook.com/chezmaman.bj',
      instagram: 'https://instagram.com/chezmaman.bj',
      tiktok: 'https://tiktok.com/@chezmaman.bj',
    },
  });

  console.log(`✅ Restaurant : Chez Maman (${restaurant.slug})`);

  // 3. Catégories de menu
  const catEntrées = await prisma.menuCategory.upsert({
    where: { id: 'seed-cat-entrees' },
    update: {},
    create: {
      id: 'seed-cat-entrees',
      restaurant_id: restaurant.id,
      name: 'Entrées',
      icon: '🥗',
      position: 0,
    },
  });

  const catPlats = await prisma.menuCategory.upsert({
    where: { id: 'seed-cat-plats' },
    update: {},
    create: {
      id: 'seed-cat-plats',
      restaurant_id: restaurant.id,
      name: 'Plats du jour',
      icon: '🍽️',
      position: 1,
    },
  });

  const catBoissons = await prisma.menuCategory.upsert({
    where: { id: 'seed-cat-boissons' },
    update: {},
    create: {
      id: 'seed-cat-boissons',
      restaurant_id: restaurant.id,
      name: 'Boissons',
      icon: '🥤',
      position: 2,
    },
  });

  const catDesserts = await prisma.menuCategory.upsert({
    where: { id: 'seed-cat-desserts' },
    update: {},
    create: {
      id: 'seed-cat-desserts',
      restaurant_id: restaurant.id,
      name: 'Desserts',
      icon: '🍮',
      position: 3,
    },
  });

  console.log('✅ Catégories créées : Entrées, Plats, Boissons, Desserts');

  // 4. Items du menu
  const menuItems = [
    // Entrées
    {
      id: 'seed-item-1',
      category_id: catEntrées.id,
      name: 'Salade de légumes frais',
      price: 1500,
      description:
        'Salade composée de légumes locaux de saison avec vinaigrette maison',
      position: 0,
    },
    {
      id: 'seed-item-2',
      category_id: catEntrées.id,
      name: 'Soupe de poisson',
      price: 2000,
      description: 'Soupe onctueuse au poisson fumé et légumes verts',
      position: 1,
    },
    // Plats
    {
      id: 'seed-item-3',
      category_id: catPlats.id,
      name: 'Poulet braisé (demi)',
      price: 4500,
      description:
        "Poulet mariné aux épices africaines, braisé au feu de bois. Servi avec du riz et de l'attiéké",
      position: 0,
    },
    {
      id: 'seed-item-4',
      category_id: catPlats.id,
      name: 'Riz au gras + poisson',
      price: 3500,
      description:
        'Riz cuit dans un bouillon savoureux, accompagné de poisson frit et de légumes',
      position: 1,
    },
    {
      id: 'seed-item-5',
      category_id: catPlats.id,
      name: 'Sauce gombo + viande',
      price: 3000,
      description:
        "Gombo frais cuisiné à la tomate avec viande de bœuf, servi avec de l'akassa ou du riz",
      position: 2,
    },
    {
      id: 'seed-item-6',
      category_id: catPlats.id,
      name: 'Brochettes de bœuf (6 pièces)',
      price: 2500,
      description:
        'Brochettes marinées et grillées, servies avec du pain maison et une sauce pimentée',
      position: 3,
    },
    // Boissons
    {
      id: 'seed-item-7',
      category_id: catBoissons.id,
      name: 'Bissap (bouteille 50cl)',
      price: 800,
      description: "Jus de fleurs d'hibiscus sucré, fraîchement préparé",
      position: 0,
    },
    {
      id: 'seed-item-8',
      category_id: catBoissons.id,
      name: 'Gingembre naturel (50cl)',
      price: 800,
      description:
        'Boisson au gingembre frais, légèrement épicée et rafraîchissante',
      position: 1,
    },
    {
      id: 'seed-item-9',
      category_id: catBoissons.id,
      name: 'Eau minérale (1L)',
      price: 500,
      description: '',
      position: 2,
    },
    {
      id: 'seed-item-10',
      category_id: catBoissons.id,
      name: 'Jus de fruits (33cl)',
      price: 700,
      description: 'Mangue, ananas ou goyave — selon disponibilité',
      position: 3,
    },
    // Desserts
    {
      id: 'seed-item-11',
      category_id: catDesserts.id,
      name: 'Crème caramel maison',
      price: 1200,
      description: 'Flan au caramel préparé chaque matin par notre chef',
      position: 0,
    },
    {
      id: 'seed-item-12',
      category_id: catDesserts.id,
      name: 'Salade de fruits tropicaux',
      price: 1500,
      description: 'Mangue, papaye, ananas et banane plantain caramélisée',
      position: 1,
    },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { id: item.id },
      update: {},
      create: {
        ...item,
        restaurant_id: restaurant.id,
        available: true,
      },
    });
  }
  console.log(`✅ ${menuItems.length} plats créés dans le menu`);

  // 5. Témoignages
  const testimonials = [
    {
      id: 'seed-t-1',
      author: 'Fatou K.',
      content:
        "Le poulet braisé est incroyable ! L'un des meilleurs de Cotonou. Je commande chaque semaine.",
      rating: 5,
    },
    {
      id: 'seed-t-2',
      author: 'Jean-Pierre A.',
      content:
        'Service rapide et plats généreux. La sauce gombo rappelle vraiment la cuisine de grand-mère.',
      rating: 5,
    },
    {
      id: 'seed-t-3',
      author: 'Mariama D.',
      content:
        "Le bissap est le meilleur que j'ai goûté en ville. Propre, bon et pas cher !",
      rating: 4,
    },
  ];
  for (const t of testimonials) {
    await prisma.testimonial.upsert({
      where: { id: t.id },
      update: {},
      create: { ...t, restaurant_id: restaurant.id },
    });
  }
  console.log('✅ Témoignages créés');

  // 6. Plan d'abonnement + Souscription démo
  const plan = await prisma.plan.upsert({
    where: { id: 'seed-plan-starter' },
    update: {},
    create: {
      id: 'seed-plan-starter',
      name: 'Starter',
      price: 15000,
      billing_cycle: 'monthly',
      features: [
        'Menu digital',
        'QR Code',
        'Statistiques de base',
        'Support email',
      ],
      active: true,
    },
  });

  const planPro = await prisma.plan.upsert({
    where: { id: 'seed-plan-pro' },
    update: {},
    create: {
      id: 'seed-plan-pro',
      name: 'Pro',
      price: 35000,
      billing_cycle: 'monthly',
      features: [
        'Tout Starter',
        'Domaine personnalisé',
        'Galerie photos',
        'Promotions',
        'Support prioritaire',
      ],
      active: true,
    },
  });

  await prisma.subscription.upsert({
    where: { restaurant_id: restaurant.id },
    update: {},
    create: {
      restaurant_id: restaurant.id,
      plan_id: plan.id,
      status: 'ACTIVE',
      start_date: new Date(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  console.log('✅ Plans créés : Starter (15 000 FCFA) + Pro (35 000 FCFA)');

  // 7. FAQ
  const faqs = [
    {
      id: 'seed-faq-1',
      question: 'Faites-vous la livraison ?',
      answer:
        'Oui ! Nous livrons dans un rayon de 5km autour de Cadjehoun. Contactez-nous sur WhatsApp pour organiser votre livraison.',
      position: 0,
    },
    {
      id: 'seed-faq-2',
      question: 'Peut-on réserver une table ?',
      answer:
        'Oui, envoyez-nous un message WhatsApp avec votre date, heure et nombre de personnes.',
      position: 1,
    },
    {
      id: 'seed-faq-3',
      question: 'Quels modes de paiement acceptez-vous ?',
      answer: 'Nous acceptons le cash, MTN Mobile Money et Moov Money.',
      position: 2,
    },
  ];
  for (const faq of faqs) {
    await prisma.faq.upsert({
      where: { id: faq.id },
      update: {},
      create: { ...faq, restaurant_id: restaurant.id },
    });
  }
  console.log('✅ FAQ créée');

  // 8. Commandes démo
  await prisma.order.upsert({
    where: { short_id: 'ZO-DEMO001' },
    update: {},
    create: {
      short_id: 'ZO-DEMO001',
      restaurant_id: restaurant.id,
      customer_phone: '+22967000001',
      note: 'Table 3',
      total_amount: 9500,
      status: 'CONFIRMED',
      ip: '127.0.0.1',
      items: {
        create: [
          {
            item_id: 'seed-item-3',
            name: 'Poulet braisé (demi)',
            unit_price: 4500,
            quantity: 1,
            subtotal: 4500,
          },
          {
            item_id: 'seed-item-7',
            name: 'Bissap (bouteille 50cl)',
            unit_price: 800,
            quantity: 2,
            subtotal: 1600,
          },
          {
            item_id: 'seed-item-11',
            name: 'Crème caramel maison',
            unit_price: 1200,
            quantity: 1,
            subtotal: 1200,
          },
          {
            item_id: 'seed-item-9',
            name: 'Eau minérale (1L)',
            unit_price: 500,
            quantity: 2,
            subtotal: 1000,
          },
          {
            item_id: 'seed-item-1',
            name: 'Salade de légumes frais',
            unit_price: 1500,
            quantity: 1,
            subtotal: 1500,
          },
        ],
      },
    },
  });

  console.log('✅ Commande démo créée : #ZO-DEMO001');

  console.log('\n🎉 Seed terminé avec succès !');
  console.log('─────────────────────────────────────────');
  console.log('🔑 Super Admin   : admin@zero-to-one.bj / SuperAdmin123!');
  console.log('🍽️  Resto Admin   : chezmaman@demo.bj / RestoPass123!');
  console.log('🌐 URL démo      : http://chez-maman.zero-to-one.bj');
  console.log('─────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
