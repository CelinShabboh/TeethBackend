import { Column, Entity, Index, JoinTable, ManyToMany } from 'typeorm';

import { User } from './user.entity';
import { Content } from './same.entity';
@Entity('doctors')
export class Doctor extends Content {

  @Index({ unique: true  })
  @Column('character varying', { nullable: false, length: 50 })
  email: string;
  @Column('character varying', { nullable: false, length: 25 })
  university: string;
  @Column('character varying', { nullable: false, length: 30 })
  collegeyear: string;
  

  //   @ManyToMany((type) => User, (user) => user.id)
  //   user: User[];
  @ManyToMany(() => User)
  @JoinTable()
  user: User[];
}
