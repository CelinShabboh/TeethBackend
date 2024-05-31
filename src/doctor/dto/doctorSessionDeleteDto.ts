import { IsNotEmpty } from 'class-validator';

export class DoctorSessionDeleteDto {
  @IsNotEmpty()
  readonly session_id: number;
}