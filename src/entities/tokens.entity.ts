import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Doctor } from './doctor.entity';

@Entity('tokens')
export class Tokens {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 64, nullable: false })
  token: string;

  @Column({ type: 'timestamptz', nullable: false })
  expiry_date: Date;

  @ManyToOne(() => Doctor, (doctor) => doctor.tokens, { eager: false })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @Column()
  doctor_id: number;
}
