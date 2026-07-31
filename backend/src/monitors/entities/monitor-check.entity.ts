import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Monitor } from './monitor.entity';
import type { MonitorStatus } from './monitor.entity';

@Entity('monitor_check')
export class MonitorCheck {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  monitorId!: number;

  @ManyToOne(() => Monitor, (monitor) => monitor.checks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'monitorId' })
  monitor!: Monitor;

  @Column()
  status!: string;

  @Column()
  responseTime!: number; // ms

  @Column({ nullable: true })
  statusCode?: number;

  @Column({ nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  checkedAt!: Date;
}
