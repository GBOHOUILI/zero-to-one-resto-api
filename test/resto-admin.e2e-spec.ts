import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Suite E2E : Resto Admin Operations', () => {
  let app: INestApplication;
  let restoToken: string;
  let categoryId: string;

  // IMPORTANT : Ce host doit exister dans ta DB (lié au restaurant de l'admin)
  // Si tu utilises le slug, assure-toi que ton middleware l'interprète bien.
  const restoHost = 'test-auto.zero-to-one.bj';

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

    // CONNEXION RESTO ADMIN
    // Note : Utilise les credentials générés lors de l'onboarding si possible
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'moreoart30@gmail.com',
        password: 'bIWcmdaEFBf$',
      });

    if (loginRes.status !== 201) {
      console.error('❌ Login échec:', loginRes.body);
    }

    restoToken = loginRes.body.access_token;
  });

  describe('Gestion du Menu (Tenant Isolation)', () => {
    it('POST /resto-admin/menus/categories', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/resto-admin/menus/categories')
        .set('Authorization', `Bearer ${restoToken}`)
        .set('x-tenant-id', restoHost)
        .set('Host', restoHost)
        .send({
          name: 'Entrées Chaudes',
          position: 1,
          icon: '🔥',
        });

      if (res.status !== 201) console.error('❌ Erreur Catégorie:', res.body);

      expect(res.status).toBe(201);
      categoryId = res.body.id;
    });

    it('POST /resto-admin/menus/items', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/resto-admin/menus/items')
        .set('Authorization', `Bearer ${restoToken}`)
        .set('Host', restoHost)
        .send({
          name: 'Pastilla Poulet',
          short_description: 'Une spécialité croustillante',
          price: 3500,
          category_id: categoryId,
          available: true,
          position: 1,
          category_type: 'FOOD',
        });

      if (res.status !== 201) console.error('❌ Erreur Item:', res.body);

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Pastilla Poulet');
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
