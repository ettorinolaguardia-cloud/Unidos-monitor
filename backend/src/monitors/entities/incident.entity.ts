import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Monitor } from './monitor.entity';

export type IncidentStatus = 'OPEN' | 'RESOLVED' | 'ACKNOWLEDGED';

@Entity('incident')
export class Incident {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  monitorId!: number;

  @ManyToOne(() => Monitor, (monitor) => monitor.incidents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'monitorId' })
  monitor!: Monitor;

  @Column({ default: 'OPEN' })
  status!: IncidentStatus;

  @Column({ nullable: true })
  cause?: string;

  @CreateDateColumn()
  startedAt!: Date;

  @Column({ nullable: true, type: 'timestamp' })
  resolvedAt?: Date;

  @Column({ nullable: true })
  durationSeconds?: number;

  @Column({ nullable: true })
  acknowledgedBy?: string;
}
