import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class ImageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  description: string;
}