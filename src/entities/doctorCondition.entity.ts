import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Doctor } from './doctor.entity';
import { Condition } from './condition.entity';
import { DoctorSession } from './doctorSession.entity';
import { ConditionLevel } from './patientCondition.entity';

@Entity('doctor_conditions')
export class DoctorCondition {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Doctor, (doctor) => doctor.conditions, { eager: false })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @ManyToOne(() => ConditionLevel, { nullable: true, eager: false })
  @JoinColumn({ name: 'level_id' })
  level: ConditionLevel;

  @ManyToOne(() => Condition, (condition) => condition.doctorConditions, {
    eager: false,
  })
  @JoinColumn({ name: 'condition_id' })
  condition: Condition;

  @ManyToOne(() => DoctorSession, (session) => session.conditions, {
    eager: false,
  })
  @JoinColumn({ name: 'session_id' })
  session: DoctorSession;
}