import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

/**
 * Tests e2e ciblés : Parcours complet d'un Resto Admin
 * Mock complet de Prisma — aucune connexion DB réelle
 */

const RESTAURANT_ID = 'e2e-resto-uuid';
const RESTO_ADMIN_ID = 'e2e-user-uuid';
const CATEGORY_ID = 'e2e-cat-uuid';

const mockCategory = {
  id: CATEGORY_ID,
  name: 'Entrées Chaudes',
  position: 0,
  icon: '🔥',
  restaurant_id: RESTAURANT_ID,
};

const mockItem = {
  id: 'e2e-item-uuid',
  name: 'Pastilla Poulet',
  price: 3500,
  available: true,
  category_id: CATEGORY_ID,
  restaurant_id: RESTAURANT_ID,
  category_type: 'FOOD',
  ingredients: [],
  allergens: [],
  accompaniments: [],
  position: 0,
};

const mockRestaurant = {
  id: RESTAURANT_ID,
  slug: 'e2e-test-resto',
  name: 'E2E Test Restaurant',
  contacts: { whatsapp: '+22961000001' },
  owner: { email: 'owner@e2e.test' },
};

const createMockPrisma = () => ({
  user: {
    findUnique: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue({}),
  },
  profile: {
    findUnique: jest.fn().mockResolvedValue({ restaurantId: RESTAURANT_ID }),
  },
  restaurant: {
    findUnique: jest.fn().mockResolvedValue(mockRestaurant),
    findMany: jest.fn().mockResolvedValue([mockRestaurant]),
    count: jest.fn().mockResolvedValue(1),
  },
  menuCategory: {
    findMany: jest.fn().mockResolvedValue([mockCategory]),
    findUnique: jest.fn((args: any) =>
      args?.where?.id === CATEGORY_ID
        ? Promise.resolve({ ...mockCategory, _count: { menu_items: 0 } })
        : Promise.resolve(null),
    ),
    findFirst: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue(mockCategory),
    update: jest.fn().mockResolvedValue(mockCategory),
    delete: jest.fn().mockResolvedValue(mockCategory),
  },
  menuItem: {
    findMany: jest.fn().mockResolvedValue([mockItem]),
    findUnique: jest.fn().mockResolvedValue(mockItem),
    findFirst: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue(mockItem),
    update: jest.fn().mockResolvedValue({ ...mockItem, available: false }),
    delete: jest.fn().mockResolvedValue(mockItem),
    count: jest.fn().mockResolvedValue(1),
  },
  gallery: {
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn().mockResolvedValue(null),
  },
  faq: {
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn().mockResolvedValue(null),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest
      .fn()
      .mockResolvedValue({
        id: 'faq-001',
        question: 'Q?',
        answer: 'R.',
        position: 0,
      }),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
  },
  promotion: {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest
      .fn()
      .mockResolvedValue({
        id: 'promo-001',
        title: 'Promo Test',
        active: true,
      }),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
  },
  businessInfo: {
    findUnique: jest.fn().mockResolvedValue(null),
    upsert: jest
      .fn()
      .mockResolvedValue({ restaurant_id: RESTAURANT_ID, delivery_fee: 500 }),
  },
  order: {
    create: jest
      .fn()
      .mockResolvedValue({
        id: 'ord-001',
        short_id: 'ZO-E2E001',
        total_amount: 3500,
        items: [
          {
            name: 'Pastilla Poulet',
            unit_price: 3500,
            quantity: 1,
            subtotal: 3500,
          },
        ],
      }),
    count: jest.fn().mockResolvedValue(1),
    findMany: jest.fn().mockResolvedValue([]),
    aggregate: jest.fn().mockResolvedValue({ _sum: { total_amount: 3500 } }),
    groupBy: jest.fn().mockResolvedValue([]),
  },
  orderItem: { groupBy: jest.fn().mockResolvedValue([]) },
  analyticsEvent: {
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    groupBy: jest.fn().mockResolvedValue([]),
  },
  testimonial: {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  teamMember: {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn(),
    delete: jest.fn(),
  },
  plan: {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
  },
  subscription: { findUnique: jest.fn().mockResolvedValue(null) },
  pageConfig: {
    findUnique: jest.fn().mockResolvedValue(null),
    upsert: jest.fn().mockResolvedValue({}),
    findMany: jest.fn().mockResolvedValue([]),
    update: jest.fn(),
    delete: jest.fn(),
  },
  contact: {
    findUnique: jest.fn().mockResolvedValue(null),
    upsert: jest.fn().mockResolvedValue({}),
  },
  socialLink: { upsert: jest.fn().mockResolvedValue({}) },
  openingHour: {
    deleteMany: jest.fn().mockResolvedValue({}),
    createMany: jest.fn().mockResolvedValue({ count: 7 }),
    findMany: jest.fn().mockResolvedValue([]),
  },
  supportTicket: {
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({ id: 'ticket-001' }),
    findUnique: jest.fn().mockResolvedValue(null),
  },
  supportMessage: { create: jest.fn().mockResolvedValue({}) },
  report: { create: jest.fn().mockResolvedValue({ id: 'rep-001' }) },
  payment: {
    findMany: jest.fn().mockResolvedValue([]),
    aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 } }),
    count: jest.fn().mockResolvedValue(0),
    groupBy: jest.fn().mockResolvedValue([]),
  },
  $transaction: jest.fn((fn: any) => {
    if (typeof fn === 'function')
      return fn({
        openingHour: {
          deleteMany: jest.fn().mockResolvedValue({}),
          createMany: jest.fn().mockResolvedValue({ count: 7 }),
        },
      });
    return Promise.all(fn);
  }),
  withTenant: jest.fn(function (this: any) {
    return this;
  }),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $executeRaw: jest.fn(),
});

describe('Resto Admin — Parcours E2E complet', () => {
  jest.setTimeout(15000);

  let app: INestApplication;
  let restoAdminToken: string;

  beforeAll(async () => {
    const mockPrisma = createMockPrisma();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    const jwtService = moduleFixture.get<JwtService>(JwtService);
    restoAdminToken = await jwtService.signAsync({
      sub: RESTO_ADMIN_ID,
      email: 'resto@e2e.test',
      role: 'RESTO_ADMIN',
      restaurantId: RESTAURANT_ID,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── Menu ────────────────────────────────────────────────────────────────────
  describe('Menu — CRUD complet', () => {
    it('GET /api/resto-admin/menus/categories — 200 liste des catégories', () => {
      return request(app.getHttpServer())
        .get('/api/resto-admin/menus/categories')
        .set('Authorization', `Bearer ${restoAdminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body[0].name).toBe('Entrées Chaudes');
        });
    });

    it('POST /api/resto-admin/menus/categories — 201 crée une catégorie', () => {
      return request(app.getHttpServer())
        .post('/api/resto-admin/menus/categories')
        .set('Authorization', `Bearer ${restoAdminToken}`)
        .send({ name: 'Plats du jour', icon: '🍽️', position: 1 })
        .expect(201);
    });

    it('GET /api/resto-admin/menus/items — 200 liste des plats', () => {
      return request(app.getHttpServer())
        .get('/api/resto-admin/menus/items')
        .set('Authorization', `Bearer ${restoAdminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
        });
    });

    it('PATCH /api/resto-admin/menus/items/:id/availability — 200 désactive un plat', () => {
      return request(app.getHttpServer())
        .patch(`/api/resto-admin/menus/items/${mockItem.id}/availability`)
        .set('Authorization', `Bearer ${restoAdminToken}`)
        .send({ available: false })
        .expect(200)
        .expect((res) => {
          expect(res.body.available).toBe(false);
        });
    });
  });

  // ─── FAQ ─────────────────────────────────────────────────────────────────────
  describe('FAQ — CRUD', () => {
    it('POST /api/resto-admin/faq — 201 crée une FAQ', () => {
      return request(app.getHttpServer())
        .post('/api/resto-admin/faq')
        .set('Authorization', `Bearer ${restoAdminToken}`)
        .send({
          question: 'Livrez-vous ?',
          answer: 'Oui, dans un rayon de 5km.',
          position: 0,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
        });
    });

    it('GET /api/resto-admin/faq — 200', () => {
      return request(app.getHttpServer())
        .get('/api/resto-admin/faq')
        .set('Authorization', `Bearer ${restoAdminToken}`)
        .expect(200);
    });
  });

  // ─── Business Info ────────────────────────────────────────────────────────────
  describe('Business Info', () => {
    it('PATCH /api/resto-admin/business-info — 200 met à jour', () => {
      return request(app.getHttpServer())
        .patch('/api/resto-admin/business-info')
        .set('Authorization', `Bearer ${restoAdminToken}`)
        .send({
          delivery_fee: 500,
          services: ['dine-in', 'delivery'],
          capacity: 60,
          payment_methods: ['cash', 'mtn-money'],
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('restaurant_id');
        });
    });
  });

  // ─── Promotions ───────────────────────────────────────────────────────────────
  describe('Promotions', () => {
    it('POST /api/resto-admin/promotions — 201', () => {
      return request(app.getHttpServer())
        .post('/api/resto-admin/promotions')
        .set('Authorization', `Bearer ${restoAdminToken}`)
        .send({
          title: '10% de réduction',
          description: 'Ce weekend seulement',
          active: true,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.title).toBe('10% de réduction');
        });
    });
  });

  // ─── Tunnel WhatsApp ──────────────────────────────────────────────────────────
  describe('Commandes WhatsApp (tunnel public)', () => {
    it('POST /api/orders — 201 crée une commande et retourne lien WhatsApp', () => {
      return request(app.getHttpServer())
        .post('/api/orders')
        .send({
          restaurant_id: RESTAURANT_ID,
          items: [
            {
              item_id: mockItem.id,
              name: 'Pastilla Poulet',
              unit_price: 3500,
              quantity: 1,
            },
          ],
          note: 'Table 5',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('short_id');
          expect(res.body).toHaveProperty('whatsapp_url');
          expect(res.body.whatsapp_url).toContain('wa.me');
          expect(res.body.total_amount).toBe(3500);
        });
    });
  });

  // ─── Intelligence Data ────────────────────────────────────────────────────────
  describe('Intelligence Data', () => {
    it('GET /api/resto-admin/intelligence/peak-hours — 200', () => {
      return request(app.getHttpServer())
        .get('/api/resto-admin/intelligence/peak-hours')
        .set('Authorization', `Bearer ${restoAdminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(24);
          expect(res.body[0]).toHaveProperty('hour');
          expect(res.body[0]).toHaveProperty('orders');
          expect(res.body[0]).toHaveProperty('revenue');
        });
    });

    it('GET /api/resto-admin/intelligence/profile-score — 200', () => {
      return request(app.getHttpServer())
        .get('/api/resto-admin/intelligence/profile-score')
        .set('Authorization', `Bearer ${restoAdminToken}`)
        .expect(200);
    });
  });
});
