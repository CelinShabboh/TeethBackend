import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { Injectable, UnauthorizedException, Request } from '@nestjs/common';
@Injectable()
export class LocalDoctorStrategy extends PassportStrategy(
  Strategy,
  'local-doctor',
) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
      passReqToCallback: true,
    });
  }
  async validate(
    @Request() req,
    email: string,
    password: string,
  ): Promise<any> {
    const doctor = await this.authService.validateDoctor(email, password);
    if (!doctor) {
      throw new UnauthorizedException();
    }
    req.doctor = doctor;
    return doctor;
  }
}
