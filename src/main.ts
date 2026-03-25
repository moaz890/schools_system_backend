import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import express from 'express';
import path from 'path';
import { HttpLoggingInterceptor } from './common/interceptors/http-logging.interceptor';
import { AppLoggerService } from './modules/core/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = app.get(AppLoggerService);

  // API prefix — all routes become /api/v1/...
  const prefix = configService.get<string>('app.prefix') || 'api/v1';
  app.setGlobalPrefix(prefix);

  // Global validation pipe — validates all DTOs automatically
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // Strip unknown properties
      forbidNonWhitelisted: false,
      transform: true,        // Auto-transform types (e.g., "1" → 1)
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalInterceptors(new HttpLoggingInterceptor(logger));

  // CORS
  const corsOrigins = configService.get<string[]>('app.corsOrigins') || ['*'];
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Serve uploaded files publicly for the frontend/app.
  // URLs are always `/uploads/...` (route), even if `UPLOAD_DEST` changes the filesystem folder.
  const uploadDest = configService.get<string>('app.uploadDest') || './uploads';
  app.use('/uploads', express.static(path.join(process.cwd(), uploadDest)));

  // Swagger API documentation
  const env = configService.get<string>('app.env');
  if (env !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Schools Platform API')
      .setDescription('Backend API for the Schools Management Platform')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${prefix}/docs`, app, document);
  }

  const port = configService.get<number>('app.port') || 3000;
  await app.listen(port);

  console.log(`🚀 Server running on: http://localhost:${port}/${prefix}`);
  if (env !== 'production') {
    console.log(`📖 Swagger docs at: http://localhost:${port}/${prefix}/docs`);
  }
}

bootstrap();
