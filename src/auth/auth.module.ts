import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DoctorService } from 'src/doctor/doctor.service';
import { JwtModule } from '@nestjs/jwt';
import { LocalUserStrategy } from './strategies/localuser-strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doctor } from 'src/entities/doctor.entity';
import { UserModule } from 'src/user/user.module';
import { PassportModule } from '@nestjs/passport';
import { LocalDoctorStrategy } from './strategies/localdoctor-strategy';
import { DoctorModule } from 'src/doctor/doctor.module';
import { UserService } from 'src/user/user.service';
import { User } from 'src/entities/user.entity';
// import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  providers: [AuthService, UserService, LocalUserStrategy, DoctorService,LocalDoctorStrategy],
  controllers: [AuthController],
  exports: [AuthService],
  imports: [
    UserModule,
    PassportModule,
    DoctorModule,
    TypeOrmModule.forFeature([Doctor,User]),
    JwtModule.register({
      global: true,
      secret: `${process.env.jwt_secret}`, //jwt_secret=secretjwt4565
      signOptions: { expiresIn: '360s' },
    }),
  ],
})
export class AuthModule {}
