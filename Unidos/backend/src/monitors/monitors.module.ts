import { Module } from '@nestjs/common';
import { MonitorsService } from './monitors.service';
import { MonitorsController } from './monitors.controller';

@Module({
  controllers: [MonitorsController],
  providers: [MonitorsService],
})
export class MonitorsModule {}
