import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Suite E2E : Opérations Plateforme Zero To One', () => {
  jest.setTimeout(60000); // Augmenté pour laisser le temps aux migrations/setup

  let app: INestApplication;

  // Variables de contexte pour chaîner les tests
  let superAdminToken: string;
  let restoToken: string;
  let restaurantId: string;
  let planId: string;
  let subscriptionId: string;
  let ticketId: string;

  const uniqueSlug = `resto-e2e-${Math.floor(Math.random() * 10000)}`;

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

  // --- PHASE 1 : ACCÈS & AUTHENTIFICATION ---
  describe('Phase 1 : Authentification', () => {
    it('POST /auth/login (Super Admin)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'eldomoreogbohouili@gmail.com', password: 'Pass123456' })
        .expect(201);

      superAdminToken = res.body.access_token;
      expect(superAdminToken).toBeDefined();
    });

    // Note: Le token du restaurateur sera récupéré après sa création en Phase 2
  });

    // --- PHASE 2 : GESTION DES RESTAURANTS (ONBOARDING) ---
  describe('Phase 2 : Onboarding Restaurant', () => {
    it('POST /super-admin/restaurants (Création par SA)', async () => {
       const payload = {
         adminEmail: `owner-${uniqueSlug}@test.com`,
         name: `Benin Food E2E ${uniqueSlug}`, // Le slug sera généré à partir de ça
         type: 'Africain',
         template: 'modern',
         primaryColor: '#E67E22',
         currency: 'XOF',
         seoKeywords: ['test', 'e2e', 'cotonou'],
         customDomains: [],
      };

       const res = await request(app.getHttpServer())
         .post('/api/super-admin/restaurants')
         .set('Authorization', `Bearer ${superAdminToken}`)
         .send(payload)
         .expect(201);

      restaurantId = res.body.id;
       expect(restaurantId).toBeDefined();
       // On vérifie que le slug a bien été généré automatiquement par le service
       expect(res.body.slug).toBeDefined();
     });

     it('Récupération du token pour le nouveau Restaurateur', async () => {
       const res = await request(app.getHttpServer())
         .post('/api/auth/login')
         .send({
           email: `owner-${uniqueSlug}@test.com`,
           password: 'DefaultPass123', // Marche grâce au process.env.NODE_ENV === 'test' dans ton service
         })
         .expect(201);

       restoToken = res.body.access_token;
       expect(restoToken).toBeDefined();
     });
   });

    it('Récupération du token pour le nouveau Restaurateur', async () => {
      // On simule la connexion du restaurateur créé pour les phases de support
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: `owner-${uniqueSlug}@test.com`,
          password: 'DefaultPass123',
        }) // Mot de passe par défaut à la création
        .expect(201);

      restoToken = res.body.access_token;
    });
  });

  // --- PHASE 3 : FACTURATION & FINANCE ---
  describe('Phase 3 : Billing & Financials', () => {
    it('POST /super-admin/subscriptions/plans (Création Plan)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/super-admin/subscriptions/plans')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Pack Premium Benin',
          price: 25000,
          billing_period: 'monthly',
          features: { items: 500, support: 'prioritaire' },
          custom_domain: true,
          max_menu_items: 500,
          analytics: true,
          active: true,
        })
        .expect(201);

      planId = res.body.id;
    });

    it('POST /super-admin/subscriptions/assign (Assignation Plan)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/super-admin/subscriptions/assign')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ restaurantId, planId })
        .expect(201);

      subscriptionId = res.body.id;
    });

    it('POST /super-admin/payments (Paiement Manuel MoMo)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/super-admin/payments')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          subscriptionId,
          amount: 25000,
          method: 'MTN_MOMO',
          transactionRef: `E2E-MO-12345`,
        })
        .expect(201);

      expect(res.body.status).toBe('COMPLETED');
    });

    it('GET /super-admin/payments/export (Export CSV)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/super-admin/payments/export')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.header['content-type']).toContain('text/csv');
    });
  });

  // --- PHASE 4 : ANALYTICS & PERFORMANCE ---
  describe('Phase 4 : Analytics Dashboard', () => {
    it('GET /super-admin/analytics/platform-stats', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/super-admin/analytics/platform-stats')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body.overview.totalRevenue).toBeGreaterThanOrEqual(25000);
    });

    it('GET /super-admin/analytics/product-performance', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/super-admin/analytics/product-performance')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body.featureAdoption).toBeDefined();
    });
  });

  // --- PHASE 5 : SUPPORT CLIENT (TICKETING) ---
  describe('Phase 5 : Customer Support System', () => {
    it('POST /my-restaurant/support/tickets (Resto crée un ticket)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/my-restaurant/support/tickets')
        .set('Authorization', `Bearer ${restoToken}`)
        .send({
          subject: 'Aide configuration domaine',
          content:
            'Bonjour, je souhaite configurer mon domaine .bj sur ma page.',
        })
        .expect(201);

      ticketId = res.body.id;
      expect(ticketId).toBeDefined();
    });

    it('GET /super-admin/support/tickets (SA voit les tickets)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/super-admin/support/tickets')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const ticket = res.body.find((t: any) => t.id === ticketId);
      expect(ticket).toBeDefined();
      expect(ticket.subject).toBe('Aide configuration domaine');
    });

    it('PATCH /super-admin/support/tickets/:id/reply (SA répond au ticket)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/super-admin/support/tickets/${ticketId}/reply`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          content:
            "C'est noté. Veuillez nous envoyer votre certificat de domaine.",
        })
        .expect(200);

      expect(res.body.is_admin).toBe(true);
    });

    it('GET /my-restaurant/support/tickets (Resto voit la réponse)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/my-restaurant/support/tickets')
        .set('Authorization', `Bearer ${restoToken}`)
        .expect(200);

      const myTicket = res.body.find((t: any) => t.id === ticketId);
      expect(myTicket.messages.length).toBeGreaterThan(1);
    });
  });

  // --- PHASE 6 : SÉCURITÉ & MAINTENANCE ---
  describe('Phase 6 : Sécurité & Maintenance', () => {
    it('POST /super-admin/restaurants/:id/reset-password', async () => {
      await request(app.getHttpServer())
        .post(`/api/super-admin/restaurants/${restaurantId}/reset-password`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(201);
    });
  });

  // --- PHASE 7 : SIGNALEMENTS (BUGS) ---
  describe('Phase 7 : Bug Reporting System', () => {
    let reportId: string;

    it('POST /my-restaurant/reports (Resto signale un bug)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/my-restaurant/reports')
        .set('Authorization', `Bearer ${restoToken}`)
        .send({
          type: 'BUG',
          priority: 'HIGH',
          description:
            "Le bouton de paiement MoMo ne s'affiche pas sur mobile.",
          page_url: '/checkout',
        })
        .expect(201);

      reportId = res.body.id;
      expect(reportId).toBeDefined();
    });

    it('GET /super-admin/reports (SA voit le signalement)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/super-admin/reports')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body.some((r: any) => r.id === reportId)).toBe(true);
    });

    it('PATCH /super-admin/reports/:id/status (SA traite le bug)', async () => {
      await request(app.getHttpServer())
        .patch(`/api/super-admin/reports/${reportId}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ status: 'INVESTIGATING', priority: 'CRITICAL' })
        .expect(200);
    });
  });

  // --- PHASE 8 : VISIBILITÉ & SEO ---
    describe('Phase 8 : SEO & Visibility (The Product)', () => {

      it('GET /seo/sitemap.xml (Public - Sitemap Generation)', async () => {
        // On simule l'appel via le host du resto pour le multi-tenant
        const res = await request(app.getHttpServer())
          .get('/api/seo/sitemap.xml')
          .set('host', `${uniqueSlug}.localhost`) // Simule le sous-domaine
          .expect(200);

        expect(res.header['content-type']).toContain('application/xml');
        expect(res.text).toContain('<?xml');
        expect(res.text).toContain('/menu');
      });

      it('GET /api/seo/super-admin/dashboard (SA - Monitoring)', async () => {
        const res = await request(app.getHttpServer())
          .get('/api/seo/super-admin/dashboard')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        const currentResto = res.body.find((r: any) => r.id === restaurantId);
        expect(currentResto).toBeDefined();
        expect(currentResto._count.menu_items).toBeDefined();
      });

      it('PATCH /api/seo/super-admin/optimize/:id (SA - SEO Injection)', async () => {
        const keywords = ['meilleur restaurant', 'cotonou food', 'zero to one'];
        const res = await request(app.getHttpServer())
          .patch(`/api/seo/super-admin/optimize/${restaurantId}`)
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send({ keywords })
          .expect(200);

        expect(res.body.seo_keywords).toContain('zero to one');
      });
    });

  afterAll(async () => {
    await app.close();
  });
});
