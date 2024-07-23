import {
  Controller,
  Body,
  Post,
  UseGuards,
  Request,
  Patch,
  Param,
  Get,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ConditionSelectionArrayDto } from 'src/dto/conditionSelectionDto';
import { UpdateUserDto } from 'src/dto/updateDto';
import { DoctorService } from 'src/doctor/doctor.service';
import { JwtGuard } from 'src/auth/guards/jwt_auth.guard';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly doctorService: DoctorService,
  ) {}

  @UseGuards(JwtGuard)
  @Post('chooseCondition')
  async chooseUserCondition(
    @Body() conditionSelectionArrayUserDto: ConditionSelectionArrayDto,
    @Request() req: any,
  ) {
    const userSessionDTO = await this.userService.saveUserChoices(
      conditionSelectionArrayUserDto.selections,
      req.user.id,
    );

    return userSessionDTO;
  }

  @UseGuards(JwtGuard)
  @Post('deleteConditions')
  async deleteUserConditions(@Request() req: any): Promise<any> {
    const userId = req.user.id;
    const userSeesion = await this.userService.getUserSessionId(userId);
    if (!userSeesion) {
      throw new NotFoundException('جلسة الطبيب غير موجودة.');
    }
    await this.userService.deleteUserSession(userSeesion.id);
    return {
      message:
        'The user session and related cases have been successfully deleted ',
    };
  }

  @UseGuards(JwtGuard)
  @Post('findDoctorsInSameGovernorate')
  async findDoctorsInSameGovernorate(@Request() req) {
    try {
      const doctors =
        await this.userService.findMatchingDoctorsInSameGobernorate(
          req.user.id,
        );
      return {
        status: 'success',
        data: doctors,
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
      };
    }
  }
  @UseGuards(JwtGuard)
  @Post('findDoctorsInOtherGovernorate')
  async findDoctorsInOtherGovernorate(
    @Request() req,
    @Body('selectedGovernorate') selectedGovernorate: string,
  ) {
    try {
      const doctors =
        await this.userService.findMatchingDoctorsInOtherGovernorate(
          req.user.id,
          selectedGovernorate,
        );
      return {
        status: 'success',
        data: doctors,
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
  updateDoctor(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUser(id, updateUserDto);
  }

  @UseGuards(JwtGuard)
  @Get('doctors/:doctorId/images')
  async getDoctorImages(@Param('doctorId') doctorId: number): Promise<any> {
    const images = await this.userService.getDoctorImages(doctorId);
    return images;
  }
  @UseGuards(JwtGuard)
  @Get('doctor/:id/profiel')
  async getDoctorProfiel(@Param('id') id: number): Promise<any> {
    const profiel = await this.userService.getDoctorProfiel(id);
    return profiel;
  }
}
