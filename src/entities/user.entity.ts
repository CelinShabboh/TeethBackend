import { Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm';
import { Doctor } from './doctor.entity';
import { Content } from './same.entity';
import { UserCondition } from './userCondition.entity';
import { UserSession } from './userSession.entity';

@Entity('users')
export class User extends Content {
  @ManyToMany(() => Doctor, (doctor) => doctor.users, { eager: false })
  @JoinTable()
  doctors: Doctor[];
  @OneToMany(() => UserCondition, (userCondition) => userCondition.user, {
    eager: false,
  })
  conditions: UserCondition[];

  @OneToMany(() => UserSession, (session) => session.user, {
    eager: false,
  })
  sessions: UserSession[];
}
