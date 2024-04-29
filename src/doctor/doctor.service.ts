import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Doctor } from 'src/entities/doctor.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateDoctorDto } from './dto/createDoctorDto';
import { User } from 'src/entities/user.entity';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async create(createDoctorDto: CreateDoctorDto): Promise<{ message: string }> {
    const { email, name, phone } = createDoctorDto;

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

      const newDoctor = queryRunner.manager.create(Doctor, createDoctorDto);
      await queryRunner.manager.save(newDoctor);

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

  async findOne(email: string): Promise<Doctor | undefined> {
    return await this.doctorRepository.findOne({ where: { email } });
  }

  async deleteUser(id: number): Promise<any> {
    const result = await this.doctorRepository.delete(id);
    return result;
  }
}