import { MonitorType } from '../entities/monitor.entity';

export class CreateMonitorDto {
  name!: string;
  description?: string;
  type!: MonitorType;
  url?: string;
  hostname?: string;
  port?: number;
  interval?: number;
  timeout?: number;
  maxRetries?: number;
  expectedCode?: number;
  expectedString?: string;
}