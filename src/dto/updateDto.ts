import { CreateDoctorDto } from 'src/dto/createDto';
import { CreateUserDto } from 'src/dto/createDto';
import { OmitType } from '@nestjs/mapped-types';
export class UpdateDoctorDto extends OmitType(CreateDoctorDto, [
  'password',
] as const) {
  photo?: string; //تخزن في صيغة base64 لترميز الصور
}

export class UpdateUserDto extends OmitType(CreateUserDto, [
  'password',
] as const) {
  photo?: string;
}
