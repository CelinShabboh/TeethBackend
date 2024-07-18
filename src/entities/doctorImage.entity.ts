import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Doctor } from './doctor.entity';
@Entity('doctor_images')
export class DoctorImage {
  @PrimaryGeneratedColumn()
  image_id: number;

  @Column()
  doctorId: number;

  @Column()
  image_url: string;

  @Column({ length: 100 })
  description: string;

  @ManyToOne(() => Doctor, (doctor) => doctor.images, {
    cascade: true,
  })
  doctor: Doctor;
}