import { Module, forwardRef } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { DoctorModule } from 'src/doctor/doctor.module';
import { UserCondition } from 'src/entities/userCondition.entity';
import { Condition } from 'src/entities/condition.entity';
import { ConditionLevel } from 'src/entities/patientCondition.entity';
import { UserSession } from 'src/entities/userSession.entity';
import { JwtStrategy } from 'src/auth/strategies/jwt_strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserCondition,
      Condition,
      ConditionLevel,
      UserSession,
    ]),
    forwardRef(() => DoctorModule),
  ],
  exports: [TypeOrmModule, UserService],
  controllers: [UserController],
  providers: [UserService, JwtStrategy],
})
export class UserModule {}