import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Suite E2E : Super Admin Operations', () => {
  jest.setTimeout(30000);
  let app: INestApplication;
  let authToken: string;
  let restaurantId: string;
  let planId: string;
  let subscriptionId: string;

  const uniqueSlug = `resto-test-${Math.floor(Math.random() * 10000)}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  describe('Phase 1 : Authentification Super Admin', () => {
    it('POST /auth/login', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'eldomoreogbohouili@gmail.com', password: 'Pass123456' })
        .expect(201);

      authToken = res.body.access_token;
      expect(authToken).toBeDefined();
    });
  });

  describe('Phase 2 : Onboarding Restaurant', () => {
    it('POST /super-admin/restaurants', async () => {
      const payload = {
        adminEmail: 'moreoart30@gmail.com',
        name: 'Restaurant E2E Test',
        slug: uniqueSlug,
        type: 'Africain',
        template: 'modern',
        primaryColor: '#E67E22',
        currency: 'XOF',
        seoKeywords: ['test', 'e2e'],
        customDomains: [],
      };

      const res = await request(app.getHttpServer())
        .post('/api/super-admin/restaurants')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      restaurantId = res.body.id;
    }, 15000);
  });

  describe('Phase 3 : Billing & Financials', () => {
    it('POST /super-admin/subscriptions/plans (Création Plan)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/super-admin/subscriptions/plans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Pack Croissance',
          price: 15000,
          billing_period: 'monthly',
          features: { items: 100 },
          custom_domain: true,
          max_menu_items: 100,
          analytics: true,
          active: true,
        });

      expect(res.status).toBe(201);
      planId = res.body.id;
    });

    it('POST /super-admin/subscriptions/assign (Assignation)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/super-admin/subscriptions/assign')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          restaurantId: restaurantId,
          planId: planId,
        });

      expect(res.status).toBe(201);
      subscriptionId = res.body.id;
    });

    it('POST /super-admin/payments (Enregistrement Flux)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/super-admin/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subscriptionId: subscriptionId,
          amount: 15000,
          method: 'MTN_MOMO',
          transactionRef: `TXN-E2E-${Date.now()}`,
        });

      if (res.status !== 201) console.error('❌ Erreur Paiement:', res.body);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('COMPLETED');
    });

    it('GET /super-admin/payments/export (Validation CSV)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/super-admin/payments/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.header['content-type']).toContain('text/csv');
      expect(res.text).toContain('ID;Restaurant;Montant');
    });
  });

  it('GET /super-admin/analytics/platform-stats (Dashboard Global)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/super-admin/analytics/platform-stats')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.overview).toBeDefined();
    expect(res.body.overview.totalRevenue).toBeGreaterThanOrEqual(15000);
    expect(res.body.recentPayments.length).toBeGreaterThan(0);
    expect(res.body.recentPayments[0].method).toBe('MTN_MOMO');
  });

  describe('Phase 4 : Sécurité & Maintenance', () => {
    it('POST /super-admin/restaurants/:id/reset-password', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/super-admin/restaurants/${restaurantId}/reset-password`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201); // Ou 200 selon ton implémentation

      // On vérifie que le service nous répond positivement
      expect(res.body).toBeDefined();
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
