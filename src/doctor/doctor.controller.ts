import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { DoctorService } from './doctor.service';
//import { JwtGuard } from 'src/auth/guards/jwt-auth.guard';
import { ConditionSelectionArrayDoctorDto } from './dto/conditionSelectionDoctorDto';
import { DoctorSessionDeleteDto } from './dto/doctorSessionDeleteDto';
import { JwtGuard } from 'src/auth/guards/jwt_auth.guard';

@Controller('doctor')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @UseGuards(JwtGuard)
  @Post('chooseCondition')
  async chooseDoctorCondition(
    @Body() conditionSelectionArrayDoctorDto: ConditionSelectionArrayDoctorDto,
    @Request() req: any,
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
    @Body() doctorSessionDeleteDto: DoctorSessionDeleteDto,
    @Request() req: any,
  ): Promise<any> {
    await this.doctorService.deleteDoctorSession(
      doctorSessionDeleteDto,
      req.user.id,
    );
    return {
      message:
        'The doctor session and related cases have been successfully deleted ',
    };
  }

  @Delete('delete/:id')
  async deleteUser(@Param('id') userId: number): Promise<any> {
    return this.doctorService.deleteUser(userId);
  }
}