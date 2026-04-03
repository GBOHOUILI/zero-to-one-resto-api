import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import basicAuth = require('express-basic-auth');
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { SentryExceptionFilter } from './common/filters/sentry-exception.filter';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  // 1. Sentry (avant tout le reste)
  if (process.env.SENTRY_DSN && process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      integrations: [nodeProfilingIntegration()],
      tracesSampleRate: 0.2, // 20% des traces en prod
      profilesSampleRate: 0.1, // 10% de profiling
      beforeSend(event) {
        // Ne jamais envoyer les tokens ou mots de passe dans Sentry
        if (event.request?.data) {
          const data = event.request.data as Record<string, any>;
          ['password', 'token', 'refresh_token', 'reset_token'].forEach((k) => {
            if (data[k]) data[k] = '[FILTERED]';
          });
        }
        return event;
      },
    });
    logger.log('✅ Sentry initialisé');
  }

  // 2. App NestJS
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // 3. Sécurité HTTP
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
          scriptSrc: ["'self'"],
        },
      },
      hsts: { maxAge: 31536000, includeSubDomains: true },
    }),
  );

  // 4. CORS
  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3001')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Postman, mobile
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS: Origin ${origin} non autorisée`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Tenant-Slug'],
    credentials: true,
  });

  // 5. Protection Swagger
  const swaggerUser = process.env.SWAGGER_USER || 'admin';
  const swaggerPass = process.env.SWAGGER_PASS || 'change-me-in-prod';

  app.use(
    ['/api-docs', '/api-docs-json'],
    basicAuth({
      challenge: true,
      users: { [swaggerUser]: swaggerPass },
    }),
  );

  // 6. Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // 7. Préfixe global
  app.setGlobalPrefix('api');

  // 8. Filtre d'exceptions (Sentry en prod, simple en dev)
  app.useGlobalFilters(new SentryExceptionFilter());

  // 9. Swagger
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Zero-To-One Resto SaaS API')
      .setDescription(
        'Documentation API multi-tenant. ' +
          'Header requis pour le multi-tenancy : "X-Tenant-Slug: [slug-restaurant]"',
      )
      .setVersion('3.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT — obtenu via POST /api/auth/login',
        },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  // 10. Graceful shutdown
  app.enableShutdownHooks();

  // 11. Lancement
  const port = parseInt(process.env.PORT ?? '3000', 10);
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 API running on: http://localhost:${port}/api`);
  logger.log(`📖 Swagger docs: http://localhost:${port}/api-docs`);
  logger.log(`🌍 Environment: ${process.env.NODE_ENV ?? 'development'}`);
}

bootstrap().catch((err) => {
  console.error('❌ Bootstrap failed:', err);
  process.exit(1);
});
