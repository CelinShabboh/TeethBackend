import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Condition } from './condition.entity';
import { User } from './user.entity';
import { ConditionLevel } from './patientCondition.entity';
import { UserSession } from './userSession.entity';
import { Exclude } from 'class-transformer';

@Entity('user_conditions')
export class UserCondition {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.conditions, {
    eager: false,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Condition, (condition) => condition.userConditions, {
    eager: false,
  })
  @JoinColumn({ name: 'condition_id' })
  condition: Condition;

  @ManyToOne(() => ConditionLevel, { nullable: true, eager: false })
  @JoinColumn({ name: 'level_id' })
  level: ConditionLevel;

  @ManyToOne(() => UserSession, (session) => session.conditions, {
    eager: false,
  })
  @JoinColumn({ name: 'session_id' })
  @Exclude({ toPlainOnly: true })
  session: UserSession;
}