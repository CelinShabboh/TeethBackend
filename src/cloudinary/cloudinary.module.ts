import { Module } from '@nestjs/common';
import { CloudinaryProvider } from './cloudinary.provider';
import { CloudinaryService } from './cloudinary.service';
import { CloudinaryController } from './cloudinary.controller';
import { DoctorService } from 'src/doctor/doctor.service';
import { MailService } from 'src/mailer/mailer.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doctor } from 'src/entities/doctor.entity';
import { DoctorCondition } from 'src/entities/doctorCondition.entity';
import { Condition } from 'src/entities/condition.entity';
import { DoctorSession } from 'src/entities/doctorSession.entity';
import { ConditionLevel } from 'src/entities/patientCondition.entity';
import { User } from 'src/entities/user.entity';
import { ResetToken } from 'src/entities/resetTokenSchema.entity';
import { DoctorImage } from 'src/entities/doctorImage.entity';
import { UserService } from 'src/user/user.service';
import { UserSession } from 'src/entities/userSession.entity';
import { UserCondition } from 'src/entities/userCondition.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Doctor,
      DoctorCondition,
      Condition,
      ConditionLevel,
      DoctorSession,
      ResetToken,
      DoctorImage,
      User,
      UserCondition,
      UserSession,
    ]),
    CloudinaryModule,
  ],
  providers: [
    CloudinaryProvider,
    CloudinaryService,
    DoctorService,
    MailService,
    UserService,
  ],
  exports: [CloudinaryProvider, CloudinaryService, MailService],
  controllers: [CloudinaryController],
})
export class CloudinaryModule {}
