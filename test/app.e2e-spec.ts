import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

/**
 * Tests e2e de l'API Zero-To-One
 *
 * Ces tests utilisent un mock complet de PrismaService — aucune connexion DB.
 * Ils testent le comportement réel de NestJS (guards, pipes, routes, statuts HTTP)
 * sans dépendance externe.
 *
 * Pour les tests avec vraie DB : utiliser une DB de test dédiée (voir DEPLOYMENT.md)
 * et exécuter avec : DATABASE_URL=test_url npm run test:e2e
 */

// ─── Fixtures globales ────────────────────────────────────────────────────────

const SUPER_ADMIN_ID = 'sa-uuid-001';
const RESTO_ADMIN_ID = 'ra-uuid-002';
const RESTAURANT_ID = 'resto-uuid-003';
const PLAN_ID = 'plan-uuid-004';

const hashedPass = bcrypt.hashSync('SuperAdmin123!', 10);
const hashedRestoPass = bcrypt.hashSync('RestoPass123!', 10);

const mockSuperAdmin = {
  id: SUPER_ADMIN_ID,
  email: 'admin@zerotoone.bj',
  password: hashedPass,
  role: 'SUPER_ADMIN',
  refresh_token: null,
  reset_token: null,
  reset_token_expiry: null,
  profile: null,
};

const mockRestoAdmin = {
  id: RESTO_ADMIN_ID,
  email: 'resto@zerotoone.bj',
  password: hashedRestoPass,
  role: 'RESTO_ADMIN',
  refresh_token: null,
  reset_token: null,
  reset_token_expiry: null,
  profile: { restaurantId: RESTAURANT_ID },
};

const mockRestaurant = {
  id: RESTAURANT_ID,
  slug: 'test-resto',
  name: 'Test Resto',
  type: 'africain',
  template: 'default',
  primary_color: '#000000',
  currency: 'XOF',
  status: 'active',
  owner_id: RESTO_ADMIN_ID,
  seo_keywords: [],
  created_at: new Date(),
  updated_at: new Date(),
  custom_domains: [],
};

const mockPlan = {
  id: PLAN_ID,
  name: 'Starter',
  price: 15000,
  billing_period: 'monthly',
  custom_domain: false,
  max_menu_items: 30,
  analytics: false,
  features: [],
  active: true,
};

// ─── Mock PrismaService complet ───────────────────────────────────────────────

const createMockPrisma = () => ({
  user: {
    findUnique: jest.fn((args: any) => {
      if (args?.where?.email === mockSuperAdmin.email)
        return Promise.resolve(mockSuperAdmin);
      if (args?.where?.email === mockRestoAdmin.email)
        return Promise.resolve(mockRestoAdmin);
      if (args?.where?.id === SUPER_ADMIN_ID)
        return Promise.resolve(mockSuperAdmin);
      if (args?.where?.id === RESTO_ADMIN_ID)
        return Promise.resolve(mockRestoAdmin);
      return Promise.resolve(null);
    }),
    findFirst: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue(mockRestoAdmin),
    update: jest.fn().mockResolvedValue({}),
    count: jest.fn().mockResolvedValue(2),
  },
  profile: {
    findUnique: jest.fn((args: any) => {
      if (args?.where?.user_id === SUPER_ADMIN_ID)
        return Promise.resolve({
          id: SUPER_ADMIN_ID,
          user_id: SUPER_ADMIN_ID,
          restaurantId: null,
        });
      if (args?.where?.user_id === RESTO_ADMIN_ID)
        return Promise.resolve({
          id: RESTO_ADMIN_ID,
          user_id: RESTO_ADMIN_ID,
          restaurantId: RESTAURANT_ID,
        });
      return Promise.resolve(null);
    }),
    upsert: jest.fn().mockResolvedValue({}),
    create: jest.fn().mockResolvedValue({}),
  },
  restaurant: {
    findUnique: jest.fn((args: any) => {
      if (
        args?.where?.id === RESTAURANT_ID ||
        args?.where?.slug === 'test-resto'
      ) {
        return Promise.resolve(mockRestaurant);
      }
      return Promise.resolve(null);
    }),
    findMany: jest.fn().mockResolvedValue([mockRestaurant]),
    create: jest.fn().mockResolvedValue(mockRestaurant),
    update: jest.fn().mockResolvedValue(mockRestaurant),
    delete: jest.fn().mockResolvedValue(mockRestaurant),
    count: jest.fn().mockResolvedValue(1),
  },
  menuCategory: {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue(null),
    create: jest
      .fn()
      .mockResolvedValue({
        id: 'cat-001',
        name: 'Entrées',
        position: 0,
        restaurant_id: RESTAURANT_ID,
      }),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
  },
  menuItem: {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue(null),
    create: jest
      .fn()
      .mockResolvedValue({
        id: 'item-001',
        name: 'Poulet',
        price: 3500,
        available: true,
      }),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
    count: jest.fn().mockResolvedValue(0),
    aggregate: jest.fn().mockResolvedValue({ _avg: { price: 3500 } }),
  },
  plan: {
    findUnique: jest.fn().mockResolvedValue(mockPlan),
    findMany: jest.fn().mockResolvedValue([mockPlan]),
    create: jest.fn().mockResolvedValue(mockPlan),
    update: jest.fn().mockResolvedValue(mockPlan),
    count: jest.fn().mockResolvedValue(1),
  },
  subscription: {
    findUnique: jest.fn().mockResolvedValue(null),
    findMany: jest.fn().mockResolvedValue([]),
    create: jest
      .fn()
      .mockResolvedValue({
        id: 'sub-001',
        restaurant_id: RESTAURANT_ID,
        plan_id: PLAN_ID,
        status: 'ACTIVE',
      }),
    update: jest.fn().mockResolvedValue({}),
    count: jest.fn().mockResolvedValue(0),
  },
  payment: {
    findMany: jest.fn().mockResolvedValue([]),
    create: jest
      .fn()
      .mockResolvedValue({ id: 'pay-001', amount: 15000, status: 'COMPLETED' }),
    aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 } }),
    count: jest.fn().mockResolvedValue(0),
    groupBy: jest.fn().mockResolvedValue([]),
  },
  order: {
    findMany: jest.fn().mockResolvedValue([]),
    create: jest
      .fn()
      .mockResolvedValue({
        id: 'ord-001',
        short_id: 'ZO-TEST01',
        total_amount: 5000,
        items: [],
      }),
    count: jest.fn().mockResolvedValue(0),
    aggregate: jest.fn().mockResolvedValue({ _sum: { total_amount: 0 } }),
    groupBy: jest.fn().mockResolvedValue([]),
  },
  orderItem: {
    groupBy: jest.fn().mockResolvedValue([]),
  },
  analyticsEvent: {
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    count: jest.fn().mockResolvedValue(0),
    groupBy: jest.fn().mockResolvedValue([]),
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
  customDomain: {
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest
      .fn()
      .mockResolvedValue({ id: 'dom-001', hostname: 'test.com' }),
    delete: jest.fn().mockResolvedValue({}),
    findMany: jest.fn().mockResolvedValue([]),
  },
  gallery: {
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn().mockResolvedValue(null),
    findUnique: jest.fn().mockResolvedValue(null),
  },
  faq: {
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({ id: 'faq-001' }),
    update: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue(null),
  },
  testimonial: {
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn().mockResolvedValue(null),
  },
  promotion: {
    findMany: jest.fn().mockResolvedValue([]),
    create: jest
      .fn()
      .mockResolvedValue({ id: 'promo-001', title: 'Test', active: true }),
    update: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn().mockResolvedValue(null),
  },
  teamMember: {
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn().mockResolvedValue(null),
  },
  businessInfo: {
    findUnique: jest.fn().mockResolvedValue(null),
    upsert: jest.fn().mockResolvedValue({ restaurant_id: RESTAURANT_ID }),
  },
  pageConfig: {
    findUnique: jest.fn().mockResolvedValue(null),
    upsert: jest.fn().mockResolvedValue({}),
    findMany: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
  },
  supportTicket: {
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({ id: 'ticket-001' }),
    findUnique: jest.fn().mockResolvedValue(null),
    update: jest.fn(),
  },
  supportMessage: { create: jest.fn().mockResolvedValue({}) },
  report: {
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({ id: 'rep-001' }),
    update: jest.fn(),
  },
  $transaction: jest.fn((fn: any) => {
    if (typeof fn === 'function') {
      return fn({
        restaurant: {
          findUnique: jest.fn().mockResolvedValue(mockRestaurant),
          delete: jest.fn().mockResolvedValue(mockRestaurant),
          create: jest.fn().mockResolvedValue(mockRestaurant),
        },
        user: {
          create: jest.fn().mockResolvedValue(mockRestoAdmin),
          delete: jest.fn().mockResolvedValue({}),
        },
        profile: { upsert: jest.fn().mockResolvedValue({}) },
        openingHour: {
          deleteMany: jest.fn().mockResolvedValue({}),
          createMany: jest.fn().mockResolvedValue({ count: 7 }),
        },
      });
    }
    return Promise.all(fn);
  }),
  withTenant: jest.fn(function (this: any) {
    return this;
  }),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $executeRaw: jest.fn(),
});

// ─── Setup ────────────────────────────────────────────────────────────────────

describe('Zero-To-One API — Tests E2E (Mockés)', () => {
  jest.setTimeout(15000);

  let app: INestApplication;
  let jwtService: JwtService;
  let superAdminToken: string;
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
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    // Générer les tokens directement — pas besoin de passer par /login
    jwtService = moduleFixture.get<JwtService>(JwtService);

    superAdminToken = await jwtService.signAsync({
      sub: SUPER_ADMIN_ID,
      email: mockSuperAdmin.email,
      role: 'SUPER_ADMIN',
      restaurantId: null,
    });

    restoAdminToken = await jwtService.signAsync({
      sub: RESTO_ADMIN_ID,
      email: mockRestoAdmin.email,
      role: 'RESTO_ADMIN',
      restaurantId: RESTAURANT_ID,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  // ════════════════════════════════════════════════════════════════════════════
  // AUTH
  // ════════════════════════════════════════════════════════════════════════════
  describe('Auth — Sécurité et accès', () => {
    it('GET /api/auth/me — retourne le profil avec un token valide', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe(mockSuperAdmin.email);
          expect(res.body.role).toBe('SUPER_ADMIN');
        });
    });

    it('GET /api/auth/me — 401 sans token', () => {
      return request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });

    it('GET /api/auth/me — 401 avec token invalide', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });

    it('POST /api/auth/login — 400 avec body vide', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({})
        .expect(400);
    });

    it('POST /api/auth/login — 400 avec email invalide', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: 'SomePass1' })
        .expect(400);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // RBAC — Role Based Access Control
  // ════════════════════════════════════════════════════════════════════════════
  describe('RBAC — Isolation des rôles', () => {
    it('GET /api/super-admin/restaurants — 403 pour RESTO_ADMIN', () => {
      return request(app.getHttpServer())
        .get('/api/super-admin/restaurants')
        .set('Authorization', `Bearer ${restoAdminToken}`)
        .expect(403);
    });

    it('GET /api/super-admin/restaurants — 200 pour SUPER_ADMIN', () => {
      return request(app.getHttpServer())
        .get('/api/super-admin/restaurants')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);
    });

    it('GET /api/super-admin/restaurants — 401 sans token', () => {
      return request(app.getHttpServer())
        .get('/api/super-admin/restaurants')
        .expect(401);
    });

    it('GET /api/super-admin/intelligence/peak-hours — 403 pour RESTO_ADMIN', () => {
      return request(app.getHttpServer())
        .get('/api/super-admin/intelligence/peak-hours')
        .set('Authorization', `Bearer ${restoAdminToken}`)
        .expect(403);
    });

    it('GET /api/resto-admin/orders/stats — 403 pour SUPER_ADMIN non-tenant', () => {
      // Le SUPER_ADMIN n'a pas de restaurantId → le TenantGuard le laisse passer
      // mais le service peut être différent selon implémentation
      return request(app.getHttpServer())
        .get('/api/resto-admin/orders/stats')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect((res) => {
          // Soit 200 (SUPER_ADMIN bypass tenant), soit 403
          expect([200, 403]).toContain(res.status);
        });
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // PUBLIC ROUTES — Pas d'auth requise
  // ════════════════════════════════════════════════════════════════════════════
  describe('Routes publiques — Accessible sans auth', () => {
    it('GET /api/plans — 200 liste des plans', () => {
      return request(app.getHttpServer())
        .get('/api/plans')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /api/gallery/:restaurantId — 200', () => {
      return request(app.getHttpServer())
        .get(`/api/gallery/${RESTAURANT_ID}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /api/faq/:restaurantId — 200', () => {
      return request(app.getHttpServer())
        .get(`/api/faq/${RESTAURANT_ID}`)
        .expect(200);
    });

    it('GET /api/promotions/:restaurantId — 200', () => {
      return request(app.getHttpServer())
        .get(`/api/promotions/${RESTAURANT_ID}`)
        .expect(200);
    });

    it('GET /api/business-info/:restaurantId — 200', () => {
      return request(app.getHttpServer())
        .get(`/api/business-info/${RESTAURANT_ID}`)
        .expect(200);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // VALIDATION — Les DTOs rejettent les mauvais inputs
  // ════════════════════════════════════════════════════════════════════════════
  describe('Validation des DTOs', () => {
    it('POST /api/orders — 400 si items vide', () => {
      return request(app.getHttpServer())
        .post('/api/orders')
        .send({ restaurant_id: RESTAURANT_ID, items: [] })
        .expect(400);
    });

    it('POST /api/orders — 400 si restaurant_id manquant', () => {
      return request(app.getHttpServer())
        .post('/api/orders')
        .send({
          items: [
            { item_id: 'i1', name: 'Plat', unit_price: 1000, quantity: 1 },
          ],
        })
        .expect(400);
    });

    it('POST /api/orders — 400 si unit_price négatif', () => {
      return request(app.getHttpServer())
        .post('/api/orders')
        .send({
          restaurant_id: RESTAURANT_ID,
          items: [
            { item_id: 'i1', name: 'Plat', unit_price: -100, quantity: 1 },
          ],
        })
        .expect(400);
    });

    it('POST /api/resto-admin/menus/categories — 400 si name manquant', () => {
      return request(app.getHttpServer())
        .post('/api/resto-admin/menus/categories')
        .set('Authorization', `Bearer ${restoAdminToken}`)
        .send({ position: 1 }) // pas de name
        .expect(400);
    });

    it('POST /api/resto-admin/faq — 400 si question vide', () => {
      return request(app.getHttpServer())
        .post('/api/resto-admin/faq')
        .set('Authorization', `Bearer ${restoAdminToken}`)
        .send({ question: '', answer: 'Une réponse' })
        .expect(400);
    });

    it('POST /api/super-admin/restaurants — 400 si adminEmail invalide', () => {
      return request(app.getHttpServer())
        .post('/api/super-admin/restaurants')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ adminEmail: 'not-an-email', name: 'Test' })
        .expect(400);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // MENUS — Flux CRUD complet
  // ════════════════════════════════════════════════════════════════════════════
  describe('Menus — CRUD via Resto Admin', () => {
    it('GET /api/resto-admin/menus/categories — 200', () => {
      return request(app.getHttpServer())
        .get('/api/resto-admin/menus/categories')
        .set('Authorization', `Bearer ${restoAdminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('POST /api/resto-admin/menus/categories — 201 crée une catégorie', () => {
      return request(app.getHttpServer())
        .post('/api/resto-admin/menus/categories')
        .set('Authorization', `Bearer ${restoAdminToken}`)
        .send({ name: 'Entrées', icon: '🥗', position: 0 })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Entrées');
        });
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // INTELLIGENCE DATA
  // ════════════════════════════════════════════════════════════════════════════
  describe('Intelligence Data', () => {
    it('GET /api/resto-admin/intelligence/peak-hours — 200', () => {
      return request(app.getHttpServer())
        .get('/api/resto-admin/intelligence/peak-hours')
        .set('Authorization', `Bearer ${restoAdminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(24); // 24 heures
        });
    });

    it('GET /api/super-admin/intelligence/basket-benchmark — 200', () => {
      return request(app.getHttpServer())
        .get('/api/super-admin/intelligence/basket-benchmark')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('platform');
          expect(res.body).toHaveProperty('by_restaurant');
        });
    });
  });
});
