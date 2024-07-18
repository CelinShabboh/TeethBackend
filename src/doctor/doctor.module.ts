import { Module, forwardRef } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { DoctorController } from './doctor.controller';
import { UserModule } from 'src/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doctor } from 'src/entities/doctor.entity';
import { DoctorCondition } from 'src/entities/doctorCondition.entity';
import { Condition } from 'src/entities/condition.entity';
import { ConditionLevel } from 'src/entities/patientCondition.entity';
import { DoctorSession } from 'src/entities/doctorSession.entity';
import { User } from 'src/entities/user.entity';
import { ResetToken } from 'src/entities/resetTokenSchema.entity';
import { MailService } from 'src/mailer/mailer.service';
import { DoctorImage } from 'src/entities/doctorImage.entity';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Doctor,
      DoctorCondition,
      Condition,
      ConditionLevel,
      DoctorSession,
      User,
      ResetToken,
      DoctorImage,
    ]),
    CloudinaryModule,
    forwardRef(() => UserModule),
  ],
  exports: [TypeOrmModule, DoctorService],
  controllers: [DoctorController],
  providers: [DoctorService, MailService, CloudinaryService],
})
export class DoctorModule {}
