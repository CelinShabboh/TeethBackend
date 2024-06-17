import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyTheEmailDto {
  @IsNotEmpty({ message: 'This field should not be empty' })
  @IsString()
  token: string;
}
