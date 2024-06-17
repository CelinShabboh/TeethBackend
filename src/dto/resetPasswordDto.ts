import {
    IsNotEmpty,
    IsString,
    IsStrongPassword,
    MaxLength,
  } from 'class-validator';
  
  export class ResetPasswordDto {
    @IsNotEmpty({ message: 'This field should not be empty' })
    @IsString()
    resetToken: string;
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
    newPassword: string;
  }