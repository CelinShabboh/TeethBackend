import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/createUserDto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { ConditionSelectionUserDto } from './dto/conditionSelectionUserDto';
import { UserCondition } from 'src/entities/userCondition.entity';
import { Condition } from 'src/entities/condition.entity';
import { ConditionLevel } from 'src/entities/patientCondition.entity';
import { UserSession } from 'src/entities/userSession.entity';
import { UserSessionDTO } from 'src/user/dto/userSessionDto';
import { UserSessionDeleteDto } from './dto/userSessionDeleteDto';
import { Doctor } from 'src/entities/doctor.entity';
import { DoctorDTO } from './dto/findDoctorDto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,

    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,

    @InjectRepository(UserCondition)
    private userConditionRepository: Repository<UserCondition>,

    @InjectRepository(UserSession)
    private userSessionRepository: Repository<UserSession>,

    @InjectRepository(Condition)
    private conditionRepository: Repository<Condition>,

    @InjectRepository(ConditionLevel)
    private conditionLevelRepository: Repository<ConditionLevel>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<{ message: string }> {
    const { name, phone } = createUserDto;

    // بداية المعاملة
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // تنفيذ استعلام قاعدة البيانات الخام
      const conflictQuery = `
          SELECT 1 FROM users WHERE name = $1 OR phone = $2
          UNION
          SELECT 1 FROM doctors WHERE name = $1 OR phone = $2
        `;
      const conflicts = await queryRunner.query(conflictQuery, [name, phone]);

      if (conflicts.length > 0) {
        await queryRunner.rollbackTransaction();
        throw new ConflictException(
          'A user with the same name or phone already exists.',
        );
      }

      const newUser = queryRunner.manager.create(User, createUserDto);
      await queryRunner.manager.save(newUser);

      await queryRunner.commitTransaction();
      return { message: 'successfully registered' };
    } catch (err) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
  async findOne(phone: string): Promise<User | undefined> {
    return await this.userRepository.findOne({ where: { phone } });
  }

  async saveUserChoices(
    conditionSelectionDtos: ConditionSelectionUserDto[],
    userId: number,
  ): Promise<UserSessionDTO> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id'],
    });
    if (!user) {
      throw new Error('User not found'); // أو يمكنك التعامل مع الخطأ بطريقة أخرى
    }
    const userSession = new UserSession();
    userSession.user = user;
    userSession.conditions = [];
    await this.userSessionRepository.save(userSession);

    const userConditionsPromises = conditionSelectionDtos.map(async (dto) => {
      const condition = await this.conditionRepository.findOne({
        where: { id: dto.condition_id },
      });

      const level = dto.level_id
        ? await this.conditionLevelRepository.findOne({
            where: { id: dto.level_id },
          })
        : null;
        const userCondition = new UserCondition();
      userCondition.condition = condition;
      userCondition.level = level;
      userCondition.user = user;
      userCondition.session = userSession;
      return await this.userConditionRepository.save(userCondition);
    });
    userSession.conditions = await Promise.all(userConditionsPromises);
    const userSessionDTO = new UserSessionDTO();
    userSessionDTO.conditions = userSession.conditions.map((cond) => ({
      condition: cond.condition.name, // افتراض أن هناك خاصية name في كيان Condition
    }));
    // تحويل المستويات إلى DTOs (إذا كان موجوداً)
    userSessionDTO.levels = userSession.conditions
      .map((cond) => ({
        level: cond.level?.level_description, // افتراض أن هناك خاصية name في كيان ConditionLevel
      }))
      .filter((l) => l.level); // إزالة المستويات التي لم يتم تعيينها

    return userSessionDTO; // إرجاع DTO بدلاً من الكيان
  }
  async deleteUserSession(
    userSessionDeleteDto: UserSessionDeleteDto,
    userId: number,
  ): Promise<void> {
    // نبدأ المعاملة
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // الحصول على جلسة الطبيب والتأكد من ملكية الطبيب لها
      const session = await queryRunner.manager.findOne(UserSession, {
        where: {
          id: userSessionDeleteDto.session_id,
          user: { id: userId },
        },
        select: ['id'],
      });

      if (!session) {
        throw new NotFoundException('لم يتم العثور على جلسة الطبيب المطلوبة.');
      }

      // حذف حالات الطبيب المرتبطة بالجلسة
      await queryRunner.manager.delete(UserCondition, {
        session: { id: session.id },
      });

      // حذف جلسة الطبيب نفسها
      await queryRunner.manager.delete(UserSession, {
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

  async findMatchingDoctorsInSameGobernorate(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['conditions', 'conditions.condition', 'conditions.level'],
    });
    if (!user && user.conditions.length === 0) {
      throw new Error('No conditions found for user or user does not exist.');
    }

    const [conditionId, levelId] = user.conditions.reduce(
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

    const doctorsQuery = this.doctorRepository
      .createQueryBuilder('doctor')
      .leftJoinAndSelect('doctor.conditions', 'doctorCondition')
      .leftJoinAndSelect('doctorCondition.condition', 'condition')
      .leftJoinAndSelect('doctorCondition.level', 'conditionLevel')
      .where('doctor.governorate = :governorate', {
        governorate: user.governorate,
      });

    // فحص الحالات حيث level_id معرف
    // يجب التأكد من أن أسلوب التعامل مع قيم 'none' مناسب لحالتك وعلى حسب كيفية تخزين البيانات في قاعدة البيانات.
    if (conditionId.length > 0) {
      doctorsQuery.andWhere(
        '(condition.id IN (:...conditionId) AND (conditionLevel.id IN (:...levelId) OR conditionLevel.id IS NULL))',
        {
          conditionId,
          levelId: levelId.filter((id) => id !== 'none'), // تجنب إرسال 'none' إلى الاستعلام
        },
      );
    }

    const doctors = await doctorsQuery.getMany();

    // إعادة تنظيم بيانات الأطباء لضمان عرض جميع الحالات لكل طبيب
    const uniqueDoctors = doctors.reduce((acc, currentDoctor) => {
      // إيجاد مؤشر الطبيب في المصفوفة المتراكمة
      const existingDoctorIndex = acc.findIndex(
        (doc) => doc.id === currentDoctor.id,
      );

      // إذا كان الطبيب موجودًا بالفعل، قم بإضافة الحالات الجديدة إليه
      if (existingDoctorIndex > -1) {
        // دمج الحالات الجديدة مع الحالات الحالية للطبيب باستخدام spread operator
        acc[existingDoctorIndex].conditions = [
          ...new Set([
            ...acc[existingDoctorIndex].conditions,
            ...currentDoctor.conditions,
          ]),
        ];
      } else {
        // إذا لم يكن الطبيب موجودًا، قم بإضافته
        acc.push(currentDoctor);
      }
      return acc;
    }, []);

    return uniqueDoctors.map((doctor) => new DoctorDTO(doctor));
  }

  async findMatchingDoctorsInOtherGovernorate(
    userId: number,
    selectedGovernorate: string,
  ) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['conditions', 'conditions.condition', 'conditions.level'],
    });

    if (!user && user.conditions.length === 0) {
      throw new Error('No conditions found for user or user does not exist.');
    }

    const [conditionId, levelId] = user.conditions.reduce(
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

    const doctorsQuery = this.doctorRepository
      .createQueryBuilder('doctor')
      .leftJoinAndSelect('doctor.conditions', 'doctorCondition')
      .leftJoinAndSelect('doctorCondition.condition', 'condition')
      .leftJoinAndSelect('doctorCondition.level', 'conditionLevel')
      .where('doctor.governorate = :selectedGovernorate', {
        selectedGovernorate,
      });

    // فحص الحالات حيث level_id معرف
    // يجب التأكد من أن أسلوب التعامل مع قيم 'none' مناسب لحالتك وعلى حسب كيفية تخزين البيانات في قاعدة البيانات.
    if (conditionId.length > 0) {
      doctorsQuery.andWhere(
        '(condition.id IN (:...conditionId) AND (conditionLevel.id IN (:...levelId) OR conditionLevel.id IS NULL))',
        {
          conditionId,
          levelId: levelId.filter((id) => id !== 'none'), // تجنب إرسال 'none' إلى الاستعلام
        },
      );
    }

    const doctors = await doctorsQuery.getMany();
    // إعادة تنظيم بيانات الأطباء لضمان عرض جميع الحالات لكل طبيب
    const uniqueDoctors = doctors.reduce((acc, currentDoctor) => {
      // إيجاد مؤشر الطبيب في المصفوفة المتراكمة
      const existingDoctorIndex = acc.findIndex(
        (doc) => doc.id === currentDoctor.id,
      );

      // إذا كان الطبيب موجودًا بالفعل، قم بإضافة الحالات الجديدة إليه
      if (existingDoctorIndex > -1) {
        // دمج الحالات الجديدة مع الحالات الحالية للطبيب باستخدام spread operator
        acc[existingDoctorIndex].conditions = [
          ...new Set([
            ...acc[existingDoctorIndex].conditions,
            ...currentDoctor.conditions,
          ]),
        ];
      } else {
        // إذا لم يكن الطبيب موجودًا، قم بإضافته
        acc.push(currentDoctor);
      }
      return acc;
    }, []);

    return uniqueDoctors.map((doctor) => new DoctorDTO(doctor));
  }
}