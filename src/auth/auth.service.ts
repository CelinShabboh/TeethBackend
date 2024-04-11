import { Injectable, UnauthorizedException } from '@nestjs/common';
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

  async login(user: User): Promise<{ access_token: string }> {
    const payload = { sub: user.id, username: user.name };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
  async signin(doctor: Doctor): Promise<{ access_token: string }> {
    const payload = { sub: doctor.id, username: doctor.name };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
