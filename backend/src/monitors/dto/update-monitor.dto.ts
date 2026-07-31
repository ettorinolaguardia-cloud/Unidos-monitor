import { PartialType } from '@nestjs/mapped-types';
import { CreateMonitorDto } from './create-monitor.dto';
import { MonitorStatus } from '../entities/monitor.entity';

export class UpdateMonitorDto extends PartialType(CreateMonitorDto) {
  status?: MonitorStatus;
  isActive?: boolean;
}
