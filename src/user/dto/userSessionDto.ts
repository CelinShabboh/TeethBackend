export class ConditionUserDTO {
    condition: string;
  }
  export class LevelUserDTO {
    level: string;
  }
  
  export class UserSessionDTO {
    conditions: ConditionUserDTO[];
    levels?: LevelUserDTO[];
  }