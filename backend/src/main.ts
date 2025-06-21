import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Настройка CORS для работы с фронтендом
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
  
  // Добавляем Helmet для безопасности
  app.use(helmet());
  
  // Префикс для всех API маршрутов
  app.setGlobalPrefix('api');
  
  await app.listen(process.env.PORT ?? 3001);
  
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
