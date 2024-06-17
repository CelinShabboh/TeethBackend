import { PartialType } from '@nestjs/mapped-types';
import {
  IsEmail,
  IsNumberString,
  IsString,
  IsNotEmpty,
  IsMobilePhone,
  MaxLength,
  IsStrongPassword,
} from 'class-validator';
export class SameDto {
  @IsString({ message: 'This field must be a string' })
  @IsNotEmpty({ message: 'This field should not be empty' })
  @MaxLength(30)
  name: string;
  @IsNumberString()
  @IsMobilePhone('ar-SY')
  @IsNotEmpty({ message: 'This field should not be empty' })
  phone: string;

  @IsNotEmpty({ message: 'This field should not be empty' })
  @IsString()
  @MaxLength(30)
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string;

  @IsNotEmpty({ message: 'This field should not be empty' })
  @IsString()
  governorate: string;
}
export class CreateDoctorDto extends PartialType(SameDto) {
  @IsEmail()
  @IsNotEmpty({ message: 'This field should not be empty' })
  email: string;

  @IsNotEmpty({ message: 'This field should not be empty' })
  @IsString()
  university: string;

  @IsNotEmpty({ message: 'This field should not be empty' })
  @IsString()
  collegeyear: string;
}
export class CreateUserDto extends PartialType(SameDto) {}