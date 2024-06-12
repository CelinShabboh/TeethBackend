import { Controller, Body, Post, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { ConditionSelectionArrayUserDto } from 'src/user/dto/conditionSelectionUserDto';
import { UserSessionDeleteDto } from 'src/user/dto/userSessionDeleteDto';
import { JwtGuard } from 'src/auth/guards/jwt_auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtGuard)
  @Post('chooseCondition')
  async chooseUserCondition(
    @Body() conditionSelectionArrayUserDto: ConditionSelectionArrayUserDto,
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
  async deleteUserConditions(
    @Body() userSessionDeleteDto: UserSessionDeleteDto,
    @Request() req: any,
  ): Promise<any> {
    await this.userService.deleteUserSession(userSessionDeleteDto, req.user.id);
    return {
      message:
        ' The user session and related cases have been successfully deleted ',
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
}