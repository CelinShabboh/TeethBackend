import { Controller, Post, Delete, Param } from '@nestjs/common';
import { DoctorService } from './doctor.service';
// import { CreateDoctorDto } from './dto/createDoctorDto';
// import { Response } from 'express';

@Controller('doctor')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  // @Post('sign-up')
  // async create(@Body() createDoctorDto: CreateDoctorDto) {
  //   return this.doctorService.create(createDoctorDto);
  // }
  // @Post('login')
  // async login(
  //   @Body('email') email: string,
  //   @Body('password') password: string,
  //   @Res() response: Response,
  // ) {
  //   const doctor = await this.doctorService.validateDoctor(email, password);
  //   if (!doctor) {
  //     throw new UnauthorizedException('الإيميل أو كلمة السر غير صحيحة');
  //   }
  //   return response.status(HttpStatus.OK).json({
  //     doctor: HttpStatus.OK,
  //     // يمكنك إضافة أي بيانات أخرى قد تحتاجها في تطبيق Flutter هنا
  //   });
  // }
  @Delete('delete/:id')
  async deleteUser(@Param('id') userId: number): Promise<any> {
    return this.doctorService.deleteUser(userId);
  }
}
