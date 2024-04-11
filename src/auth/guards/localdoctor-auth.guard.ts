import { AuthGuard } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
@Injectable()
export class LocalDoctorAuthGuard extends AuthGuard('local-doctor') {}
