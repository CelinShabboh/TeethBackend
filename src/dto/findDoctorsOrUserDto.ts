export class FindDoctorDTO {
  id: number;
  name: string;
  phone: string;
  governorate: string;
  university: string;
  collegeYear: number;
  conditions: { id: number; name: string; levelDescription?: string }[];

  constructor(doctorEntity: any) {
    this.id = doctorEntity.id;
    this.name = doctorEntity.name;
    this.phone = doctorEntity.phone;
    this.governorate = doctorEntity.governorate;
    this.university = doctorEntity.university;
    this.collegeYear = doctorEntity.collegeYear;
    this.conditions =
      doctorEntity.conditions?.map((cond) => ({
        id: cond.condition.id,
        name: cond.condition.name,
        levelDescription: cond.level?.level_description ?? null,
      })) || []; 
  }
}
export class FindUserDTO {
  id: number;
  name: string;
  phone: string;
  governorate: string;
  conditions: { id: number; name: string; levelDescription?: string }[];

  constructor(userEntity: any) {
    this.id = userEntity.id;
    this.name = userEntity.name;
    this.phone = userEntity.phone;
    this.governorate = userEntity.governorate;
    this.conditions =
      userEntity.conditions?.map((cond) => ({
        id: cond.condition.id,
        name: cond.condition.name,
        levelDescription: cond.level?.level_description ?? null,
      })) || []; 
  }
}
