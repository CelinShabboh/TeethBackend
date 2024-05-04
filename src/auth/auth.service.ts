import { Injectable } from '@nestjs/common';
import { DoctorService } from 'src/doctor/doctor.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { User } from 'src/entities/user.entity';
import { Doctor } from 'src/entities/doctor.entity';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private doctorService: DoctorService,
    private jwtService: JwtService,
  ) {}
  async validateUser(phone: string, password: string): Promise<any> {
    const user = await this.userService.findOne(phone);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
  async validateDoctor(email: string, password: string): Promise<any> {
    const doctor = await this.doctorService.findOne(email);
    if (doctor && (await bcrypt.compare(password, doctor.password))) {
      const { password, ...result } = doctor;
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
      refresh_token: this.jwtService.sign(user_info, { expiresIn: '120d' }),
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
      refresh_token: this.jwtService.sign(doctor_info, { expiresIn: '120d' }),
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
      access_token: await this.jwtService.signAsync(doctor_info, { expiresIn: '180d' }),
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
      access_token: await this.jwtService.signAsync(user_info ,{ expiresIn: '180d' }),
    };
  }
}