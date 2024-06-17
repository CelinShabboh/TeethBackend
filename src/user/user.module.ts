import { Module, forwardRef } from '@nestjs/common';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { DoctorModule } from 'src/doctor/doctor.module';
import { JwtStrategy } from 'src/auth/strategies/jwt-strategy';
import { UserCondition } from 'src/entities/userCondition.entity';
import { Condition } from 'src/entities/condition.entity';
import { ConditionLevel } from 'src/entities/patientCondition.entity';
import { UserSession } from 'src/entities/userSession.entity';
import { Doctor } from 'src/entities/doctor.entity';
import { UserService } from './user.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserCondition,
      Condition,
      ConditionLevel,
      UserSession,
      Doctor,
    ]),
    forwardRef(() => DoctorModule),
  ],
  exports: [TypeOrmModule, UserService],
  controllers: [UserController],
  providers: [JwtStrategy, UserService],
})
export class UserModule {}
