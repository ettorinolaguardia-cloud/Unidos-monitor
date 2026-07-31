import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Consente le chiamate dal frontend Angular
  await app.listen(process.env.PORT ?? 3000);
  console.log('🚀 Backend NestJS avviato su http://localhost:3000');
}
bootstrap();
