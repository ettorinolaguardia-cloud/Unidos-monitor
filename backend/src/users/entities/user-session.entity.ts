import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_sessions')
export class UserSession {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  email: string;

  @Column()
  role: string;

  @Column({ default: 'ONLINE' })
  status: 'ONLINE' | 'IDLE' | 'BUSY';

  @Column({ default: '127.0.0.1' })
  ip: string;

  @Column({ default: 'Workstation Node' })
  location: string;

  @Column({ nullable: true })
  connectedSince: string;

  @Column({ default: 10 })
  ping: number;

  @Column({ default: '👤' })
  avatar: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
