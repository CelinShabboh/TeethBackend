import {
    IsNotEmpty,
    IsOptional,
    IsArray,
    ValidateNested,
  } from 'class-validator';
  import { Type } from 'class-transformer';
  
  export class ConditionSelectionDoctorDto {
    @IsNotEmpty()
    readonly condition_id: number;
    @IsOptional()
    readonly level_id?: number;
  }
  export class ConditionSelectionArrayDoctorDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ConditionSelectionDoctorDto)
    selections: ConditionSelectionDoctorDto[];
  }