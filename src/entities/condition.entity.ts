import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserCondition } from './userCondition.entity';
import { DoctorCondition } from './doctorCondition.entity';
import { ConditionLevel } from './patientCondition.entity';

@Entity('conditions')
export class Condition {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  name: string;

  @OneToOne(() => ConditionLevel, (conditionLevel) => conditionLevel.condition)
  @JoinColumn({ name: 'level_id' })
  level: ConditionLevel;

  @OneToMany(() => UserCondition, (userCondition) => userCondition.condition, {
    eager: false,
  })
  userConditions: UserCondition[];

  @OneToMany(
    () => DoctorCondition,
    (doctorCondition) => doctorCondition.condition,
    { eager: false },
  )
  doctorConditions: DoctorCondition[];
}
