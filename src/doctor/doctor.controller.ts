import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Patch,
  Request,
  NotFoundException,
  Get,
} from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { ConditionSelectionArrayDto } from 'src/dto/conditionSelectionDto';
import { UpdateDoctorDto } from 'src/dto/updateDto';
import { JwtGuard } from 'src/auth/guards/jwt_auth.guard';
@Controller('doctor')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @UseGuards(JwtGuard)
  @Post('chooseCondition')
  async chooseDoctorCondition(
    @Body() conditionSelectionArrayDoctorDto: ConditionSelectionArrayDto,
    @Request() req,
  ) {
    const doctorSessionDTO = await this.doctorService.saveDoctorChoices(
      conditionSelectionArrayDoctorDto.selections,
      req.user.id,
    );
    return doctorSessionDTO;
  }

  @UseGuards(JwtGuard)
  @Post('deleteConditions')
  async deleteDoctorConditions(
    @Request() req: any,
  ): Promise<{ message: string }> {
    const doctorId = req.user.id;
    const doctorSession = await this.doctorService.getDoctorSessionId(doctorId);

    if (!doctorSession) {
      throw new NotFoundException('جلسة الطبيب غير موجودة.');
    }
    await this.doctorService.deleteDoctorSession(doctorSession.id);
    return {
      message:
        'The doctor session and related cases have been successfully deleted ',
    };
  }

  @Delete('delete/:id')
  async deleteDoctor(
    @Param('id') doctorId: number,
  ): Promise<{ message: string }> {
    return this.doctorService.deleteDoctor(doctorId);
  }
  
  @UseGuards(JwtGuard)
  @Post('findUsersInSameGovernorate')
  async findUsersInSameGovernorate(@Request() req) {
    try {
      const users = await this.doctorService.findMatchingUsersInSameGobernorate(
        req.user.id,
      );
      return {
        status: 'success',
        data: users,
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
      };
    }
  }
  @UseGuards(JwtGuard)
  @Post('findUsersInOtherGovernorate')
  async findUsersInOtherGovernorate(
    @Request() req,
    @Body('selectedGovernorate') selectedGovernorate: string,
  ) {
    try {
      const users =
        await this.doctorService.findMatchingUsersInOtherGobernorate(
          req.user.id,
          selectedGovernorate,
        );
      return {
        status: 'success',
        data: users,
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
      };
    }
  }
  @UseGuards(JwtGuard)
  @Patch(':id')
  updateDoctor(
    @Param('id') id: number,
    @Body() updateDoctorDto: UpdateDoctorDto,
  ) {
    return this.doctorService.updateDoctor(id, updateDoctorDto);
  }
  @UseGuards(JwtGuard)
  @Get('user/:id/profiel')
  async getUserProfiel(@Param('id') id: number): Promise<any> {
    const profiel = await this.doctorService.getUserProfiel(id);
    return profiel;
  }
}
