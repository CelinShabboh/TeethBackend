import { Module, forwardRef } from '@nestjs/common';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { DoctorModule } from 'src/doctor/doctor.module';
import { UserCondition } from 'src/entities/userCondition.entity';
import { Condition } from 'src/entities/condition.entity';
import { ConditionLevel } from 'src/entities/patientCondition.entity';
import { UserSession } from 'src/entities/userSession.entity';
import { Doctor } from 'src/entities/doctor.entity';
import { UserService } from './user.service';
import { DoctorService } from 'src/doctor/doctor.service';
import { MailService } from 'src/mailer/mailer.service';
import { DoctorImage } from 'src/entities/doctorImage.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { JwtStrategy } from 'src/auth/strategies/jwt_strategy';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserCondition,
      Condition,
      ConditionLevel,
      UserSession,
      Doctor,
      DoctorImage,
    ]),
    CloudinaryModule,
    forwardRef(() => DoctorModule),
  ],
  exports: [TypeOrmModule, UserService],
  controllers: [UserController],
  providers: [JwtStrategy, UserService, DoctorService, MailService],
})
export class UserModule {}
