import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MonitorsModule } from './monitors/monitors.module';
import { Monitor } from './monitors/entities/monitor.entity'; // Importa la tua tabella

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres', // Cambia se il tuo utente è diverso
      password: 'unidos2026', // Metti la tua password reale
      database: 'unidos', // Cambia se il tuo database è diverso
      entities: [Monitor], // Qui vede la tabella da creare
      synchronize: true, // Questo comando crea le tabelle per te!
    }),
    MonitorsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}