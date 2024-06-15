import { CreateDoctorDto } from 'src/dto/createDto';
import { CreateUserDto } from 'src/dto/createDto';
import { PartialType } from '@nestjs/mapped-types';
export class UpdateDoctorDto extends PartialType(CreateDoctorDto) {
  photo?: string; //تخزن في صيغة base64 لترميز الصور
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  photo?: string;
}