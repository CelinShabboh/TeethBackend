import { IsNotEmpty } from 'class-validator';

export class UserSessionDeleteDto {
  @IsNotEmpty()
  readonly session_id: number;
}