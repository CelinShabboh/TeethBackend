import { IsNotEmpty } from 'class-validator';

export class SessionDeleteDto {
  @IsNotEmpty()
  readonly session_id: number;
}
