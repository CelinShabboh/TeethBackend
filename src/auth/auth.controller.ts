import {
  Body,
  Controller,
  Post,
  Put,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateDoctorDto } from 'src/dto/createDto';
import { DoctorService } from 'src/doctor/doctor.service';
import { LocalUserAuthGuard } from './guards/localuser-auth.guard';
import { LocalDoctorAuthGuard } from './guards/localdoctor-auth.guard';
import { CreateUserDto } from 'src/dto/createDto';
import { UserService } from 'src/user/user.service';
import { RefreshJwtGuard } from './guards/refresh-jwt-auth.guard';
import { ChangePasswordDto } from 'src/dto/changePasswordDto';
import { JwtGuard } from './guards/jwt_auth.guard';
import { ForgotPasswordDto } from 'src/dto/forgotPasswordDto';
import { ResetPasswordDto } from 'src/dto/resetPasswordDto';
import { VerifyTheEmailDto } from 'src/dto/verifyTheEmailDto';
// import { ForgotPasswordDoctorDto } from 'src/doctor/dto/forgotPasswordDoctorDto';

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
  @UseGuards(JwtGuard)
  @Put('doctor/change-password')
  async changePasswordDoctor(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req: any,
  ) {
    return this.authService.changePasswordDoctor(
      req.user.id,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );
  }
  @UseGuards(JwtGuard)
  @Put('user/change-password')
  async changePasswordUser(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req: any,
  ) {
    return this.authService.changePasswordUser(
      req.user.id,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );
  }
  @UseGuards(JwtGuard)
  @Post('doctor/forgot-password')
  async forgotPasswordDoctor(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPasswordDoctor(forgotPasswordDto.email);
  }
  @UseGuards(JwtGuard)
  @Put('doctor/reset-password')
  async resetPasswordDoctor(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPasswordDoctor(
      resetPasswordDto.newPassword,
      resetPasswordDto.resetToken,
    );
  }
  @Post('doctor/verify-the-email')
  async verifyTheEmail(@Body() verifyTheEmailDto: VerifyTheEmailDto) {
    return this.authService.verifyTheEmail(verifyTheEmailDto.token);
  }
}