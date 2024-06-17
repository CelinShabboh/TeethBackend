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
import { UserController } from 'src/user/user.controller';
import { RefreshJwtStrategy } from './strategies/refreshToken.strategy';
import { JwtStrategy } from './strategies/jwt_strategy';
import { MailService } from 'src/mailer/mailer.service';
import { ResetToken } from 'src/entities/resetTokenSchema.entity';
@Module({
  providers: [
    AuthService,
    UserService,
    DoctorService,
    LocalUserStrategy,
    DoctorService,
    LocalDoctorStrategy,
    JwtStrategy,
    RefreshJwtStrategy,
    MailService,
  ],
  controllers: [AuthController, UserController],
  exports: [AuthService, JwtStrategy],
  imports: [
    UserModule,
    PassportModule,
    DoctorModule,
    TypeOrmModule.forFeature([Doctor, User, ResetToken]),
    JwtModule.register({
      global: true,
      secret: process.env.jwt_secret,
      signOptions: { expiresIn: '30d', algorithm: 'HS256' },
    }),
  ],
})
export class AuthModule {}