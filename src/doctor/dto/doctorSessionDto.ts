export class ConditionDoctorDTO {
    condition: string;
  }
  export class LevelDoctorDTO {
    level: string;
  }
  
  export class DoctorSessionDTO {
    conditions: ConditionDoctorDTO[];
    levels?: LevelDoctorDTO[];
  }