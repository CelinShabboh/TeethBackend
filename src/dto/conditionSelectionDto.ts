import {
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ConditionSelectionDto {
  @IsNotEmpty()
  readonly condition_id: number;
  @IsOptional()
  readonly level_id?: number;
}
export class ConditionSelectionArrayDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConditionSelectionDto)
  selections: ConditionSelectionDto[];
}
