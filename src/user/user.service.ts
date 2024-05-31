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
import { UserSessionDTO } from './dto/userSessionDto';
import { UserSessionDeleteDto } from './dto/userSessionDeleteDto';
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,

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
}