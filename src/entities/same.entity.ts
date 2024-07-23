import {
  BeforeInsert,
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
@Entity('content')
export abstract class Content {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  photo:string;

  @Index({ unique: true })
  @Column('character varying', { nullable: false, length: 50 })
  name: string;

  @Column('character varying', { nullable: false, length: 130 })
  password: string;

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }

  @Index({ unique: true })
  @Column('character varying', { nullable: false, length: 10 })
  phone: string;

  @Column('character varying', { nullable: false, length: 10 })
  governorate: string;
}

