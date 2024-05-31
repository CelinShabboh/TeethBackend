import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Doctor } from 'src/entities/doctor.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateDoctorDto } from './dto/createDoctorDto';
import { ConditionSelectionDoctorDto } from './dto/conditionSelectionDoctorDto';
import { Condition } from 'src/entities/condition.entity';
import { DoctorSession } from 'src/entities/doctorSession.entity';
import { DoctorCondition } from 'src/entities/doctorCondition.entity';
import { ConditionLevel } from 'src/entities/patientCondition.entity';
import { DoctorSessionDeleteDto } from './dto/doctorSessionDeleteDto';
import { DoctorSessionDTO } from './dto/doctorSessionDto';
// import { MailerService } from 'src/mailer/mailer.service';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    private dataSource: DataSource,

    @InjectRepository(Condition)
    private conditionRepository: Repository<Condition>,

    @InjectRepository(DoctorCondition)
    private doctorConditionRepository: Repository<DoctorCondition>,

    @InjectRepository(DoctorSession)
    private doctorSessionRepository: Repository<DoctorSession>,

    @InjectRepository(ConditionLevel)
    private conditionLevelRepository: Repository<ConditionLevel>,
    // private readonly mailerService: MailerService,
  ) {}

  async create(createDoctorDto: CreateDoctorDto): Promise<{ message: string }> {
    const { email, name, phone } = createDoctorDto;
    // const verificationCode = this.generateVerificationCode();
    // const verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);
    // بداية المعاملة
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // تنفيذ استعلام قاعدة البيانات الخام
      const conflictQuery = `
        SELECT 1 FROM doctors WHERE email = $1
        UNION
        SELECT 1 FROM doctors WHERE name = $2 OR phone = $3
        UNION
        SELECT 1 FROM users WHERE name = $2 OR phone = $3
      `;
      const conflicts = await queryRunner.query(conflictQuery, [
        email,
        name,
        phone,
      ]);

      if (conflicts.length > 0) {
        await queryRunner.rollbackTransaction();
        throw new ConflictException(
          'An account with similar email, name, or phone already exists.',
        );
      }
      // const newDoctorData = { ...createDoctorDto, verificationCode, verificationCodeExpiry };
      const newDoctor = queryRunner.manager.create(Doctor, createDoctorDto);
      await queryRunner.manager.save(newDoctor);
      // await this.mailerService.sendVerificationEmail(email, verificationCode);
      await queryRunner.commitTransaction();
      return {
        message:
          'successfully registered , Please check your email for verification code.',
      };
    } catch (err) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findOne(email: string): Promise<Doctor | undefined> {
    return await this.doctorRepository.findOne({ where: { email } });
  }

  async saveDoctorChoices(
    conditionSelectionDtos: ConditionSelectionDoctorDto[],
    doctorId: number,
  ): Promise<DoctorSessionDTO> {
    const doctor = await this.doctorRepository.findOne({
      where: { id: doctorId },
      select: ['id'],
    });
    if (!doctor) {
      throw new Error('doctor not found');
    }
    const doctorSession = new DoctorSession();
    doctorSession.doctor = doctor;
    doctorSession.conditions = [];
    await this.doctorSessionRepository.save(doctorSession);

    const doctorConditionsPromises = conditionSelectionDtos.map(async (dto) => {
      const condition = await this.conditionRepository.findOne({
        where: { id: dto.condition_id },
      });
      const level = dto.level_id
      ? await this.conditionLevelRepository.findOne({
          where: { id: dto.level_id },
        })
      : null;

    const doctorCondition = new DoctorCondition();
    doctorCondition.condition = condition;
    doctorCondition.level = level;
    doctorCondition.doctor = doctor;
    doctorCondition.session = doctorSession;
    return await this.doctorConditionRepository.save(doctorCondition);
  });
  doctorSession.conditions = await Promise.all(doctorConditionsPromises);
  const doctorSessionDTO = new DoctorSessionDTO();
  doctorSessionDTO.conditions = doctorSession.conditions.map((cond) => ({
    condition: cond.condition.name, // افتراض أن هناك خاصية name في كيان Condition
  }));
  // تحويل المستويات إلى DTOs (إذا كان موجوداً)
  doctorSessionDTO.levels = doctorSession.conditions
    .map((cond) => ({
      level: cond.level?.level_description, // افتراض أن هناك خاصية name في كيان ConditionLevel
    }))
    .filter((l) => l.level); // إزالة المستويات التي لم يتم تعيينها

  return doctorSessionDTO; // إرجاع DTO بدلاً من الكيان
}

async deleteDoctorSession(
  doctorSessionDeleteDto: DoctorSessionDeleteDto,
  doctorId: number,
): Promise<void> {
  // نبدأ المعاملة
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // الحصول على جلسة الطبيب والتأكد من ملكية الطبيب لها
    const session = await queryRunner.manager.findOne(DoctorSession, {
      where: {
        id: doctorSessionDeleteDto.session_id,
        doctor: { id: doctorId },
      },
      select: ['id'],
    });

    if (!session) {
      throw new NotFoundException('لم يتم العثور على جلسة الطبيب المطلوبة.');
    }

    // حذف حالات الطبيب المرتبطة بالجلسة
    await queryRunner.manager.delete(DoctorCondition, {
      session: { id: session.id },
    });

    // حذف جلسة الطبيب نفسها
    await queryRunner.manager.delete(DoctorSession, {
      id: session.id,
    });

    // إذا كل شيء سار كما يجب، نُكمل المعاملة ونحفظ التغييرات
    await queryRunner.commitTransaction();
  } catch (err) {
    // إذا حدث خطأ، نتراجع عن التغييرات
    await queryRunner.rollbackTransaction();
    throw err;
  } finally {
    // في نهاية عمل المعاملة (سواء تم الإلتزام أو التراجع)، نُغلق الاتصال
    await queryRunner.release();
  }
}

async deleteUser(id: number): Promise<any> {
  const result = await this.doctorRepository.delete(id);
  return result;
}
// private generateVerificationCode(): string {
//   // افترض أن هذه الوظيفة توليد رمز فريد
//   return Math.random().toString(36).substring(2, 8).toUpperCase();
// }
}