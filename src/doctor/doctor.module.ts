import { Module, forwardRef } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { DoctorController } from './doctor.controller';
import { UserModule } from 'src/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doctor } from 'src/entities/doctor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Doctor]), forwardRef(() => UserModule)],
  exports: [TypeOrmModule, DoctorService],
  controllers: [DoctorController],
  providers: [DoctorService],
})
export class DoctorModule {}
