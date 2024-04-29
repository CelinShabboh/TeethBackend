import { Module, forwardRef } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { DoctorModule } from 'src/doctor/doctor.module';
import { JwtStrategy } from 'src/auth/strategies/jwt_strategy';


@Module({
  imports:[TypeOrmModule.forFeature([User]),  forwardRef(() => DoctorModule) ],
  exports:[TypeOrmModule,UserService],
  controllers: [UserController],
  providers: [UserService,JwtStrategy],
})
export class UserModule {}