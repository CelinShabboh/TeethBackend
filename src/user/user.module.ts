import { Module, forwardRef } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { DoctorModule } from 'src/doctor/doctor.module';


@Module({
  imports:[TypeOrmModule.forFeature([User]),  forwardRef(() => DoctorModule) ],
  exports:[TypeOrmModule,UserService],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}