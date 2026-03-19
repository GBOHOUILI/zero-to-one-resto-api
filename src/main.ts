import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import basicAuth = require('express-basic-auth');
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- PROTECTION DU SWAGGER ---
  // On applique la sécurité uniquement sur les routes de la doc
  app.use(
    ['/api-docs', '/api-docs-json'],
    basicAuth({
      challenge: true,
      users: {
        // Idéalement, utilise des variables d'environnement (process.env.SWAGGER_USER)
        'admin-resto': 'ZetoToOne2026!',
      },
    }),
  );

  // Active la validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Toutes tes routes commenceront par /api (sauf Swagger si configuré au-dessus)
  app.setGlobalPrefix('api');

  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('Zero-To-One Resto SaaS API')
    .setDescription(
      'Documentation privée. Utilisez les identifiants fournis pour tester les endpoints. ' +
        'Chaque requête doit inclure le header "Host" pour le multi-tenancy.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Entrez votre token JWT ici',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // On expose le swagger sur /api-docs pour ne pas qu'il s'entrechoque avec le préfixe global /api
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Application running on: http://localhost:${port}/api`);
  console.log(`📖 Swagger documentation on: http://localhost:${port}/api-docs`);
}
bootstrap();
