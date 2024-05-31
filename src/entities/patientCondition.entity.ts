import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Condition } from './condition.entity';

@Entity('condition_levels')
export class ConditionLevel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  level_description: string;

  @OneToOne(() => Condition, (condition) => condition.level)
  condition: Condition;
}