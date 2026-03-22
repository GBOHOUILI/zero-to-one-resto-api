import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Zero-To-One API (Full Suite e2e)', () => {
  jest.setTimeout(30000);
  let app: INestApplication;
  let authToken: string;
  let restaurantId: string;
  let planId: string;
  let subscriptionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // On définit le préfixe pour correspondre à ton main.ts
    app.setGlobalPrefix('api');

    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  // --- SECTION 1: AUTHENTIFICATION ---
  describe('Auth Module', () => {
    it('POST /auth/login - Should connect Super Admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login') // On garde /api ici si tu n'as pas activé le prefixe dans le test OU on l'enlève si app.setGlobalPrefix est actif.
        // Note: Si app.setGlobalPrefix('api') est actif, utilise l'URL complète comme ci-dessous:
        .send({ email: 'eldomoreogbohouili@gmail.com', password: 'Pass123456' })
        .expect(201);

      authToken = res.body.access_token;
      expect(authToken).toBeDefined();
    });

    it('GET /auth/me - Should return profile', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe('eldomoreogbohouili@gmail.com');
        });
    });
  });

  // --- SECTION 2: GESTION DES RESTAURANTS ---
  describe('Restaurants Module', () => {
    it('POST /super-admin/restaurants - Create new restaurant', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/super-admin/restaurants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          adminEmail: 'eldomoreo@gmail.com',
          name: 'Test Automatique Resto',
          slug: 'test-auto',
          type: 'Africain',
          template: 'modern',
          primaryColor: '#000000',
          currency: 'XOF',
        })
        .expect(201);

      restaurantId = res.body.id;
    }, 15000);
  });

  // --- SECTION 3: ABONNEMENTS ---
  describe('Subscriptions Module', () => {
    it('POST /super-admin/subscriptions/plans - Create a Plan', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/super-admin/subscriptions/plans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Premium Test',
          price: 15000,
          billing_period: 'monthly',
          features: {},
          custom_domain: true,
          max_menu_items: 100,
          analytics: true,
        })
        .expect(201);
      planId = res.body.id;
    });

    it('POST /super-admin/subscriptions/assign - Assign plan', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/super-admin/subscriptions/assign')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          restaurantId: restaurantId,
          planId: planId,
          status: 'pending',
        })
        .expect(201);
      subscriptionId = res.body.id;
    });

    it('POST /super-admin/subscriptions/payments - Record Payment', () => {
      return request(app.getHttpServer())
        .post('/api/super-admin/subscriptions/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subscriptionId: subscriptionId,
          amount: 15000,
          method: 'MTN_MOMO',
          transactionRef: 'MOMO-TEST-99',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.status).toBe('COMPLETED');
        });
    });
  });

  // --- SECTION 4: MENU (RA) ---
  describe('Menu Module (Resto Admin)', () => {
    it('POST /resto-admin/menus/categories - Create category', () => {
      return request(app.getHttpServer())
        .post('/api/resto-admin/menus/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Host', 'test-auto.zero-to-one.bj') // Multi-tenancy check
        .send({ name: 'Entrées', position: 1, icon: '🥗' })
        .expect(201);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
