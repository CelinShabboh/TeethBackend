import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/createUserDto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
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
}