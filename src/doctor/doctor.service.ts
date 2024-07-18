import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Doctor } from 'src/entities/doctor.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateDoctorDto } from 'src/dto/createDto';
import { ConditionSelectionDto } from 'src/dto/conditionSelectionDto';
import { SessionDTO } from 'src/dto/sessionDto';
import { Condition } from 'src/entities/condition.entity';
import { DoctorSession } from 'src/entities/doctorSession.entity';
import { DoctorCondition } from 'src/entities/doctorCondition.entity';
import { ConditionLevel } from 'src/entities/patientCondition.entity';
import { User } from 'src/entities/user.entity';
import { FindUserDTO } from 'src/dto/findDoctorsOrUserDto';
import { nanoid } from 'nanoid';
import { ResetToken } from 'src/entities/resetTokenSchema.entity';
import { MailService } from 'src/mailer/mailer.service';
import { Tokens } from 'src/entities/tokens.entity';
import { UpdateDoctorDto } from 'src/dto/updateDto';
import { DoctorImage } from 'src/entities/doctorImage.entity';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
@Injectable()
export class DoctorService {
  constructor(
    private mailService: MailService,
    private cloudinaryService: CloudinaryService,
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    private dataSource: DataSource,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Condition)
    private conditionRepository: Repository<Condition>,

    @InjectRepository(DoctorCondition)
    private doctorConditionRepository: Repository<DoctorCondition>,

    @InjectRepository(DoctorSession)
    private doctorSessionRepository: Repository<DoctorSession>,

    @InjectRepository(ConditionLevel)
    private conditionLevelRepository: Repository<ConditionLevel>,

    @InjectRepository(ResetToken)
    private resetToken: Repository<ResetToken>,

    @InjectRepository(DoctorImage)
    private readonly doctorImageRepository: Repository<DoctorImage>,
  ) {}

  async create(createDoctorDto: CreateDoctorDto): Promise<{ message: string }> {
    const { email, name, phone } = createDoctorDto;
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
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

      const newDoctor = queryRunner.manager.create(Doctor, createDoctorDto);
      await queryRunner.manager.save(newDoctor);

      const tokens = nanoid(64);
      const expiry_date = new Date();
      expiry_date.setMinutes(expiry_date.getMinutes() + 2);

      const resetTokenObject = queryRunner.manager.create(Tokens, {
        token: tokens,
        doctor: newDoctor,
        expiry_date,
      });
      await queryRunner.manager.save(resetTokenObject);
      this.mailService.sendToken(email, tokens);
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
    conditionSelectionDtos: ConditionSelectionDto[],
    doctorId: number,
  ): Promise<SessionDTO> {
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
    const sessionData = [];
    const doctorSessionDTO = new SessionDTO(sessionData);
    doctorSessionDTO.data = [];

    for (const doctorCondition of doctorSession.conditions) {
      doctorSessionDTO.data.push({
        condition: doctorCondition.condition.name,
        level: doctorCondition.level
          ? doctorCondition.level.level_description
          : null,
      });
    }

    return doctorSessionDTO; // إرجاع DTO بدلاً من الكيان
  }

  async deleteDoctorSession(doctorSessionId: number): Promise<void> {
    // نبدأ المعاملة
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // الحصول على جلسة الطبيب والتأكد من ملكية الطبيب لها
      const session = await queryRunner.manager.findOne(DoctorSession, {
        where: {
          id: doctorSessionId,
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
  async findMatchingUsersInSameGobernorate(userId: number) {
    const doctor = await this.doctorRepository.findOne({
      where: { id: userId },
      relations: ['conditions', 'conditions.condition', 'conditions.level'],
    });

    if (!doctor || doctor.conditions.length === 0) {
      throw new Error('No conditions found for user or user does not exist.');
    }

    const [conditionId, levelId] = doctor.conditions.reduce(
      (acc, cur) => {
        if (cur && cur.condition) {
          acc[0].push(cur.condition.id);
          // استخدم null بدلا من 'none'
          acc[1].push(cur.level ? cur.level.id : null);
        }
        return acc;
      },
      [[], []],
    );

    const usersQuery = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.conditions', 'userCondition')
      .leftJoinAndSelect('userCondition.condition', 'condition')
      .leftJoinAndSelect('userCondition.level', 'conditionLevel')
      .where('user.governorate = :governorate', {
        governorate: doctor.governorate,
      });

    // فحص الحالات حيث level_id معرف
    // يجب التأكد من أن أسلوب التعامل مع قيم 'none' مناسب لحالتك وعلى حسب كيفية تخزين البيانات في قاعدة البيانات.
    if (conditionId.length > 0) {
      usersQuery.andWhere(
        '(condition.id IN (:...conditionId) AND (conditionLevel.id IN (:...levelId) OR conditionLevel.id IS NULL))',
        {
          conditionId,
          levelId: levelId.filter((id) => id !== 'none'), // تجنب إرسال 'none' إلى الاستعلام
        },
      );
    }

    const users = await usersQuery.getMany();

    // إعادة تنظيم بيانات الأطباء لضمان عرض جميع الحالات لكل طبيب
    const uniqueUsers = users.reduce((acc, currentUser) => {
      // إيجاد مؤشر الطبيب في المصفوفة المتراكمة
      const existingUserIndex = acc.findIndex(
        (doc) => doc.id === currentUser.id,
      );

      // إذا كان الطبيب موجودًا بالفعل، قم بإضافة الحالات الجديدة إليه
      if (existingUserIndex > -1) {
        // دمج الحالات الجديدة مع الحالات الحالية للطبيب باستخدام spread operator
        acc[existingUserIndex].conditions = [
          ...new Set([
            ...acc[existingUserIndex].conditions,
            ...currentUser.conditions,
          ]),
        ];
      } else {
        // إذا لم يكن الطبيب موجودًا، قم بإضافته
        acc.push(currentUser);
      }
      return acc;
    }, []);

    return uniqueUsers.map((doctor) => new FindUserDTO(doctor));
  }
  async findMatchingUsersInOtherGobernorate(
    userId: number,
    selectedGovernorate: string,
  ) {
    const doctor = await this.doctorRepository.findOne({
      where: { id: userId },
      relations: ['conditions', 'conditions.condition', 'conditions.level'],
    });

    if (!doctor || doctor.conditions.length === 0) {
      throw new Error('No conditions found for user or user does not exist.');
    }

    const [conditionId, levelId] = doctor.conditions.reduce(
      (acc, cur) => {
        if (cur && cur.condition) {
          acc[0].push(cur.condition.id);
          // استخدم null بدلا من 'none'
          acc[1].push(cur.level ? cur.level.id : null);
        }
        return acc;
      },
      [[], []],
    );

    const usersQuery = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.conditions', 'userCondition')
      .leftJoinAndSelect('userCondition.condition', 'condition')
      .leftJoinAndSelect('userCondition.level', 'conditionLevel')
      .where('user.governorate = :selectedGovernorate', {
        selectedGovernorate,
      });

    // فحص الحالات حيث level_id معرف
    // يجب التأكد من أن أسلوب التعامل مع قيم 'none' مناسب لحالتك وعلى حسب كيفية تخزين البيانات في قاعدة البيانات.
    if (conditionId.length > 0) {
      usersQuery.andWhere(
        '(condition.id IN (:...conditionId) AND (conditionLevel.id IN (:...levelId) OR conditionLevel.id IS NULL))',
        {
          conditionId,
          levelId: levelId.filter((id) => id !== 'none'), // تجنب إرسال 'none' إلى الاستعلام
        },
      );
    }

    const users = await usersQuery.getMany();

    // إعادة تنظيم بيانات الأطباء لضمان عرض جميع الحالات لكل طبيب
    const uniqueUsers = users.reduce((acc, currentUser) => {
      // إيجاد مؤشر الطبيب في المصفوفة المتراكمة
      const existingUserIndex = acc.findIndex(
        (doc) => doc.id === currentUser.id,
      );

      // إذا كان الطبيب موجودًا بالفعل، قم بإضافة الحالات الجديدة إليه
      if (existingUserIndex > -1) {
        // دمج الحالات الجديدة مع الحالات الحالية للطبيب باستخدام spread operator
        acc[existingUserIndex].conditions = [
          ...new Set([
            ...acc[existingUserIndex].conditions,
            ...currentUser.conditions,
          ]),
        ];
      } else {
        // إذا لم يكن الطبيب موجودًا، قم بإضافته
        acc.push(currentUser);
      }
      return acc;
    }, []);

    return uniqueUsers.map((doctor) => new FindUserDTO(doctor));
  }
  async updateDoctor(
    id: number,
    updateDoctorDto: UpdateDoctorDto,
  ): Promise<Partial<Doctor>> {
    await this.doctorRepository.update(id, updateDoctorDto);
    const updatedDoctor = await this.doctorRepository.findOne({
      where: { id },
      select: [
        'id',
        'name',
        'phone',
        'governorate',
        'email',
        'university',
        'collegeyear',
      ],
    });

    return updatedDoctor;
  }
  // async setDoctorStatus(doctorId: number, isOnline: boolean): Promise<void> {
  //   const doctor = await this.doctorRepository.findOne(doctorId);
  //   if (doctor) {
  //     doctor.isOnline = isOnline;
  //     await this.doctorRepository.save(doctor);
  //   }
  // }
  // async getDoctorStatus(doctorId: number): Promise<boolean> {
  //   const doctor = await this.doctorRepository.findOne(doctorId);
  //   return doctor ? doctor.isOnline : false;
  // }
  async getDoctorSessionId(doctorId: number): Promise<DoctorSession | null> {
    return await this.doctorSessionRepository.findOne({
      where: { doctor: { id: doctorId } },
    });
  }
  async uploadImage(
    description: string,
    uploadedImage: Express.Multer.File,
    doctorId: number,
  ) {
    const cloudinaryResponse =
      await this.cloudinaryService.uploadFile(uploadedImage);
    const secureUrl = cloudinaryResponse.secure_url;
    const newImage = new DoctorImage();
    newImage.description = description;
    newImage.image_url = secureUrl;
    newImage.doctorId = doctorId;
    await this.doctorImageRepository.save(newImage, { reload: true });

    return { secure_url: secureUrl };
  }
}
