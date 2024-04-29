import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateDoctorDto } from 'src/doctor/dto/createDoctorDto';
import { DoctorService } from 'src/doctor/doctor.service';
import { LocalUserAuthGuard } from './guards/localuser-auth.guard';
import { LocalDoctorAuthGuard } from './guards/localdoctor-auth.guard';
import { CreateUserDto } from 'src/user/dto/createUserDto';
import { UserService } from 'src/user/user.service';
import { RefreshJwtGuard } from './guards/refresh-jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private doctorService: DoctorService,
    private userService: UserService,
  ) {}
  @Post('doctor/sign-up')
  async registerDoctor(@Body() createDoctorDto: CreateDoctorDto) {
    return this.doctorService.create(createDoctorDto);
  }
  @Post('user/sign-up')
  async registerUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }
  @UseGuards(LocalUserAuthGuard)
  @Post('user/login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(LocalDoctorAuthGuard)
  @Post('doctor/login')
  async signin(@Request() req) {
    return this.authService.signin(req.doctor);
  }
  @UseGuards(RefreshJwtGuard)
  @Post('doctor/refresh')
  async refreshTokenDoctor(@Request() req) {
    return this.authService.refreshTokenDoctor(req.user);
  }
  @UseGuards(RefreshJwtGuard)
  @Post('user/refresh')
  async refreshTokenUser(@Request() req) {
    return this.authService.refreshTokenUser(req.user);
  }

  // @UseGuards(JwtGuard)
  // @Get('profile')
  // getProfile(@Request() req) {
  //   return req.user;
  // }
}