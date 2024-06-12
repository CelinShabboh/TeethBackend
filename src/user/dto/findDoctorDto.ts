export class DoctorDTO {
  id: number;
  name: string;
  phone: string;
  governorate: string;
  university: string;
  collegeYear: number;
  // تحديث النوع ليشير إلى التنقيح الجديد
  conditions: { id: number; name: string; levelDescription?: string }[];

  constructor(doctorEntity: any) {
    this.id = doctorEntity.id;
    this.name = doctorEntity.name;
    this.phone = doctorEntity.phone;
    this.governorate = doctorEntity.governorate;
    this.university = doctorEntity.university;
    this.collegeYear = doctorEntity.collegeYear;
    // لاحظ التعديل في كيفية معالجة الظروف ومستوياتها
    this.conditions =
      doctorEntity.conditions?.map((cond) => ({
        id: cond.condition.id,
        name: cond.condition.name,
        // تأكد من أن cond.condition.level لا يعيد null
        levelDescription: cond.level?.level_description ?? null,
      })) || []; // استخدام مصفوفة فارغة كقيمة افتراضية في حال فشل التحميل
  }
}