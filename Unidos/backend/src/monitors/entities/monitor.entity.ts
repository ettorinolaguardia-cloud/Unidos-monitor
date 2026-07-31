import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('monitor')
export class Monitor {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  type!: string;

  @Column()
  url!: string;

  @Column()
  interval!: number;
}