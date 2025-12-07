import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import { RedisStore } from 'connect-redis';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);
  const redisClient = createClient({
    url: config.getOrThrow<string>('REDIS_URI'),
  });
  await redisClient.connect();

  const redisStore = new RedisStore({
    client: redisClient,
    prefix: config.getOrThrow<string>('SESSION_FOLDER'),
  });

  app.use(cookieParser(config.getOrThrow<string>('COOKIE_SECRET')));
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.use(
    session({
      store: redisStore,
      secret: config.getOrThrow<string>('REDIS_SECRET'),
      name: config.getOrThrow<string>('SESSION_NAME'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        domain: config.getOrThrow<string>('SESSION_DOMAIN'),
        maxAge: 18e5,
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
      },
    }),
  );

  app.enableCors({
    origin: config.getOrThrow<string>('ALLOWED_ORIGIN'),
    credentials: true,
    exposedHeaders: ['set-cookie'],
  });

  await app.listen(5000, () => console.log('Сревер запущен'));
}
bootstrap();
