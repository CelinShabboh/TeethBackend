import { Controller, Body, Post, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { ConditionSelectionArrayUserDto } from './dto/conditionSelectionUserDto';
import { UserSessionDeleteDto } from './dto/userSessionDeleteDto';
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
}