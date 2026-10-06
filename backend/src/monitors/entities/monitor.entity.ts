import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { MonitorCheck } from './monitor-check.entity';
import { Incident } from './incident.entity';

export type MonitorType = 'http' | 'https' | 'tcp' | 'ping' | 'api';
export type MonitorStatus = 'UP' | 'DOWN' | 'DEGRADED' | 'PENDING' | 'PAUSED' | 'MAINTENANCE';

@Entity('monitor')
export class Monitor {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: 'http' })
  type!: MonitorType;

  @Column({ nullable: true })
  url?: string;

  @Column({ nullable: true })
  hostname?: string;

  @Column({ nullable: true })
  port?: number;

  @Column({ default: 2 })
  interval!: number; // intervallo in minuti

  @Column({ default: 10 })
  timeout!: number; // timeout in secondi

  @Column({ default: 3 })
  maxRetries!: number;

  @Column({ default: 0 })
  consecutiveFailures!: number;

  @Column({ nullable: true })
  expectedCode?: number;

  @Column({ nullable: true })
  expectedString?: string;

  @Column({ default: 'PENDING' })
  status!: MonitorStatus;

  @Column({ nullable: true, type: 'timestamp' })
  lastCheckAt?: Date;

  @Column({ nullable: true })
  lastResponseTime?: number; // in millisecondi

  @Column({ nullable: true, type: 'timestamp' })
  sslExpiryDate?: Date;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => MonitorCheck, (check) => check.monitor)
  checks?: MonitorCheck[];

  @OneToMany(() => Incident, (incident) => incident.monitor)
  incidents?: Incident[];
}