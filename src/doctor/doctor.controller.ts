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
  UseInterceptors,
  UploadedFile,
  Req,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { DoctorService } from './doctor.service';
import { ConditionSelectionArrayDto } from 'src/dto/conditionSelectionDto';
import { UpdateDoctorDto } from 'src/dto/updateDto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageDto } from 'src/dto/imageDto';
import { diskStorage } from 'multer';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { CloudinaryResponse } from 'src/cloudinary/cloudinary-response';
import axios from 'axios';
import { JwtGuard } from 'src/auth/guards/jwt_auth.guard';
import { error } from 'console';
@Controller('doctor')
export class DoctorController {
  constructor(
    private readonly doctorService: DoctorService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

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
  async deleteDoctorConditions(@Request() req: any): Promise<any> {
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
  async deleteUser(@Param('id') userId: number): Promise<any> {
    return this.doctorService.deleteUser(userId);
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
  @Post('gallery/images')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        filename: (
          req: ExpressRequest,
          file: Express.Multer.File,
          callback,
        ): void => {
          const name: string = file.originalname.split('.')[0];
          const fileExtension: string = file.originalname.split('.')[1];
          const newFileName: string =
            name.split(' ').join('_') + '_' + Date.now() + '.' + fileExtension;
          callback(null, newFileName);
        },
      }),
      fileFilter: (
        req: ExpressRequest,
        file: Express.Multer.File,
        callback,
      ): void => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return callback(null, false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadImage(
    @Req() req,
    @UploadedFile() uploadedImage: Express.Multer.File,
    @Body() imageDto: ImageDto,
  ) {
    function bufferToBlob(buffer: Buffer, type: string) {
      const arrayBuffer = new Uint8Array(buffer).buffer;
      return new Blob([arrayBuffer], { type: type });
    }
    const formData = new FormData();
    const blob = bufferToBlob(uploadedImage.buffer, uploadedImage.mimetype);
    formData.append('file', blob, uploadedImage.originalname);

    try {
      const uploadResponse = await axios.post<CloudinaryResponse>(
        '/api/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      const secureUrl = uploadResponse.data.secure_url;

      // بقية الخطوات لحفظ الصورة واستجابة الطلب
      const doctorId = req.user.id;
      await this.doctorService.uploadImage(
        imageDto.description,
        secureUrl,
        doctorId,
      );

      return { secure_url: secureUrl };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to upload image');
    }
  }
}
