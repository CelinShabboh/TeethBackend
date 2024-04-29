import { Controller, Post, Delete, Param } from '@nestjs/common';
import { DoctorService } from './doctor.service';
// import { CreateDoctorDto } from './dto/createDoctorDto';
// import { Response } from 'express';

@Controller('doctor')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

 
  @Delete('delete/:id')
  async deleteUser(@Param('id') userId: number): Promise<any> {
    return this.doctorService.deleteUser(userId);
  }
}
