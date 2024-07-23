import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from 'src/dto/createDto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { ConditionSelectionDto } from 'src/dto/conditionSelectionDto';
import { UserCondition } from 'src/entities/userCondition.entity';
import { Condition } from 'src/entities/condition.entity';
import { ConditionLevel } from 'src/entities/patientCondition.entity';
import { UserSession } from 'src/entities/userSession.entity';
import { SessionDTO } from 'src/dto/sessionDto';
import { Doctor } from 'src/entities/doctor.entity';
import { FindDoctorDTO } from 'src/dto/findDoctorsOrUserDto';
import { UpdateUserDto } from 'src/dto/updateDto';
import { DoctorImage } from 'src/entities/doctorImage.entity';

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

    @InjectRepository(DoctorImage)
    private readonly doctorImageRepository: Repository<DoctorImage>,
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
    conditionSelectionDtos: ConditionSelectionDto[],
    userId: number,
  ): Promise<SessionDTO> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id'],
    });
    if (!user) {
      throw new Error('User not found');
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
    const sessionData = [];
    const userSessionDTO = new SessionDTO(sessionData);
    userSessionDTO.data = [];

    for (const userCondition of userSession.conditions) {
      userSessionDTO.data.push({
        condition: userCondition.condition.name,
        level: userCondition.level
          ? userCondition.level.level_description
          : null,
      });
    }

    return userSessionDTO;
  }
  async deleteUserSession(userSessionId: number): Promise<void> {
    // نبدأ المعاملة
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // الحصول على جلسة الطبيب والتأكد من ملكية الطبيب لها
      const session = await queryRunner.manager.findOne(UserSession, {
        where: {
          id: userSessionId,
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

    if (!user || user.conditions.length === 0) {
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

    return uniqueDoctors.map((doctor) => new FindDoctorDTO(doctor));
  }

  async findMatchingDoctorsInOtherGovernorate(
    userId: number,
    selectedGovernorate: string,
  ) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['conditions', 'conditions.condition', 'conditions.level'],
    });

    if (!user || user.conditions.length === 0) {
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

    return uniqueDoctors.map((doctor) => new FindDoctorDTO(doctor));
  }
  async updateUser(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<Partial<User>> {
    await this.userRepository.update(id, updateUserDto);
    const updatedUser = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'name', 'phone', 'governorate'],
    });

    return updatedUser;
  }
  async getUserSessionId(userId: number): Promise<UserSession | null> {
    return await this.userSessionRepository.findOne({
      where: { user: { id: userId } },
    });
  }
  async getDoctorImages(doctorId: number): Promise<any[]> {
    const images = await this.doctorImageRepository.find({
      where: { doctorId },
    });
    return images.map((image) => ({
      image_url: image.image_url,
      description: image.description,
    }));
  }
  async getDoctorProfiel(id: number): Promise<any> {
    const profiel = await this.doctorRepository.findOne({
      where: { id },
    });
    return profiel;
  }
  async uploadPhoto(imageUrl: string, userId: number) {
    const newImage = this.userRepository.create();
    newImage.photo = imageUrl;
    newImage.id = userId;
    await this.userRepository.save(newImage, { reload: true });

    return { image_url: newImage.photo };
  }
}
