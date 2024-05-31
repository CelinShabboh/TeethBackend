import {
    IsNotEmpty,
    IsOptional,
    IsArray,
    ValidateNested,
  } from 'class-validator';
  import { Type } from 'class-transformer';
  
  export class ConditionSelectionUserDto {
    @IsNotEmpty()
    readonly condition_id: number;
    @IsOptional()
    readonly level_id?: number;
  }
  export class ConditionSelectionArrayUserDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ConditionSelectionUserDto)
    selections: ConditionSelectionUserDto[];
  }