import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  const origins = process.env.FRONTEND_URL?.split(',').map((origin) => origin.trim()).filter(Boolean);
  if (process.env.NODE_ENV === 'production' && (!origins || origins.length === 0)) {
    throw new Error('FRONTEND_URL must list the deployed frontend origin(s) in production.');
  }
  app.enableCors({
    origin: origins?.length ? origins : ['http://localhost:3000'],
    credentials: true,
  });
  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
