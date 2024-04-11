import { Entity, JoinTable, ManyToMany } from 'typeorm';
import { Doctor } from './doctor.entity';
import { Content } from './same.entity';

@Entity('users')
export class User extends Content {
//   @ManyToMany((type) => Doctor, (doctor) => doctor.id)
//   doctor: Doctor[];

  @ManyToMany(() => Doctor)
    @JoinTable()
    doctor: Doctor[]
}
