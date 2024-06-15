import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DoctorService } from 'src/doctor/doctor.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { User } from 'src/entities/user.entity';
import { Doctor } from 'src/entities/doctor.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// import { VerificationCodeService } from 'src/verification/verificationCodeService';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private doctorService: DoctorService,
    private jwtService: JwtService,
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async validateUser(phone: string, password: string): Promise<any> {
    const user = await this.userService.findOne(phone);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { ...result } = user;
      return result;
    }
    return null;
  }

  async validateDoctor(email: string, password: string): Promise<any> {
    const doctor = await this.doctorService.findOne(email);
    if (doctor && (await bcrypt.compare(password, doctor.password))) {
      const { ...result } = doctor;
      return result;
    }
    return null;
  }

  async login(user: User) {
    const user_info = {
      id: user.id,
      username: user.name,
      phone: user.phone,
      governorate: user.governorate,
    };
    const tokens = {
      access_token: await this.jwtService.signAsync(user_info),
      refresh_token: this.jwtService.sign(user_info, { expiresIn: '30d' }),
    };
    return {
      user_info,
      tokens,
    };
  }
  async signin(doctor: Doctor) {
    const doctor_info = {
      id: doctor.id,
      username: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      governorate: doctor.governorate,
      university: doctor.university,
      collegeyear: doctor.collegeyear,
    };
    const tokens = {
      access_token: await this.jwtService.signAsync(doctor_info),
      refresh_token: this.jwtService.sign(doctor_info, { expiresIn: '30d' }),
    };
    return {
      doctor_info,
      tokens,
    };
  }
  async refreshTokenDoctor(doctor: Doctor) {
    const doctor_info = {
      id: doctor.id,
      username: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      governorate: doctor.governorate,
      university: doctor.university,
      collegeyear: doctor.collegeyear,
    };
    return {
      access_token: await this.jwtService.signAsync(doctor_info, {
        expiresIn: '30d',
      }),
    };
  }
  async refreshTokenUser(user: User) {
    const user_info = {
      id: user.id,
      username: user.name,
      phone: user.phone,
      governorate: user.governorate,
    };
    return {
      access_token: await this.jwtService.signAsync(user_info, {
        expiresIn: '30d',
      }),
    };
  }

  async changePasswordDoctor(
    doctorId: number,
    oldPassword: string,
    newPassword: string,
  ): Promise<string> {
    const doctor = await this.doctorRepository.findOne({
      where: { id: doctorId },
    });
    if (!doctor) {
      throw new NotFoundException('User not found');
    }
    const passwordMatch = await bcrypt.compare(oldPassword, doctor.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Wrong credentials');
    }
    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    doctor.password = newHashedPassword;
    await this.doctorRepository.save(doctor);
    return 'تم تغيير كلمة المرور بنجاح';
  }
  async changePasswordUser(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Wrong credentials');
    }
    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = newHashedPassword;
    await this.userRepository.save(user);
    return 'تم تغيير كلمة المرور بنجاح';
  }
}