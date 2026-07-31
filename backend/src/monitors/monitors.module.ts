import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonitorsService } from './monitors.service';
import { MonitorsController } from './monitors.controller';
import { Monitor } from './entities/monitor.entity';
import { MonitorCheck } from './entities/monitor-check.entity';
import { Incident } from './entities/incident.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Monitor, MonitorCheck, Incident]),
    NotificationsModule,
  ],
  controllers: [MonitorsController],
  providers: [MonitorsService],
  exports: [MonitorsService],
})
export class MonitorsModule {}
