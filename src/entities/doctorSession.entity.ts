import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
  } from 'typeorm';
  import { Doctor } from './doctor.entity';
  import { DoctorCondition } from './doctorCondition.entity';
  
  @Entity('doctor_sessions')
  export class DoctorSession {
    @PrimaryGeneratedColumn()
    id: number;
  
    @ManyToOne(() => Doctor, (doctor) => doctor.sessions, { eager: false })
    @JoinColumn({ name: 'doctor_id' })
    doctor: Doctor;
  
    @OneToMany(
      () => DoctorCondition,
      (doctorCondition) => doctorCondition.session,
      {
        cascade: true,
        eager: false,
      },
    )
    conditions: DoctorCondition[];
  }