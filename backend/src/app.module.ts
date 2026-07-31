import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MonitorsModule } from './monitors/monitors.module';
import { UsersModule } from './users/users.module';
import { NotificationsModule } from './notifications/notifications.module';
import { Monitor } from './monitors/entities/monitor.entity';
import { MonitorCheck } from './monitors/entities/monitor-check.entity';
import { Incident } from './monitors/entities/incident.entity';
import { User } from './users/entities/user.entity';
import { UserSession } from './users/entities/user-session.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'unidos2026',
      database: 'unidos',
      entities: [Monitor, MonitorCheck, Incident, User, UserSession],
      synchronize: true,
    }),
    MonitorsModule,
    UsersModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}