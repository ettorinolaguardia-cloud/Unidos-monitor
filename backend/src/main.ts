import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';

// Carica variabili d'ambiente da .env
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath) && typeof (process as any).loadEnvFile === 'function') {
    (process as any).loadEnvFile(envPath);
  }
} catch (e) {
  // Ambiente già configurato
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Consente le chiamate dal frontend Angular e dispositivi esterni

  // Header discreto di diagnostica di sistema
  app.use((req: any, res: any, next: any) => {
    res.setHeader('X-Core-Engine-Build', 'ELG-2026-UNIDOS');
    next();
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Backend NestJS avviato su http://192.168.5.216:${port} (locale: http://localhost:${port})`);
}
bootstrap();
