import {
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
  } from 'typeorm';
  import { User } from './user.entity';
  import { UserCondition } from './userCondition.entity';
  import { Exclude, Expose } from 'class-transformer';
  @Entity('user_sessions')
  export class UserSession {
    @PrimaryGeneratedColumn()
    id: number;
  
    @ManyToOne(() => User, (user) => user.sessions, { eager: false })
    @JoinColumn({ name: 'user_id' })
    @Exclude({ toPlainOnly: true })
    user: User;
  
    @OneToMany(() => UserCondition, (userCondition) => userCondition.session, {
      cascade: true,
      eager: false,
    })
    conditions: UserCondition[];
    @Expose()
    get userInfo() {
      return {
        id: this.user?.id,
        name: this.user?.name,
      };
    }
  }