import {
  IsEmail,
  IsNumberString,
  IsString,
  IsNotEmpty,
  IsMobilePhone,
  MaxLength,
  IsStrongPassword,
} from 'class-validator';

export class CreateDoctorDto {
  @IsEmail()
  @IsNotEmpty({ message: 'This field should not be empty' })
  email: string;

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
  governorate: string;

  @IsNotEmpty({ message: 'This field should not be empty' })
  university: string;

  @IsNotEmpty({ message: 'This field should not be empty' })
  collegeyear: string;
}
