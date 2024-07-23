import {
    Body,
    Controller,
    Post,
    UploadedFile,
    Request,
    UseInterceptors,
    UseGuards,
    Put,
  } from '@nestjs/common';
  import { CloudinaryService } from './cloudinary.service';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { ImageDto } from 'src/dto/imageDto';
  import { DoctorService } from 'src/doctor/doctor.service';
  import { UserService } from 'src/user/user.service';
import { JwtGuard } from 'src/auth/guards/jwt_auth.guard';
  
  @Controller('upload')
  export class CloudinaryController {
    constructor(
      private readonly cloudinaryService: CloudinaryService,
      private readonly doctorService: DoctorService,
      private readonly userService: UserService,
    ) {}
    @UseGuards(JwtGuard)
    @Post('doctor/gallery/images')
    @UseInterceptors(FileInterceptor('file'))
    async uploadImage(
      @Request() req,
      @UploadedFile() file: Express.Multer.File,
      @Body() imageDto: ImageDto,
    ) {
      const doctorId = req.user.id;
      const secureUrl = await this.cloudinaryService.uploadFile(file);
      const newImage = await this.doctorService.uploadImage(
        imageDto.description,
        secureUrl,
        doctorId,
      );
      return { image: newImage };
    }
    @UseGuards(JwtGuard)
    @Put('doctor/photo')
    @UseInterceptors(FileInterceptor('photo'))
    async doctoruploadPhoto(
      @Request() req,
      @UploadedFile() image: Express.Multer.File,
    ): Promise<{ message: string }> {
      const doctorId = req.user.id;
      const secureUrl = await this.cloudinaryService.uploadFile(image);
      await this.doctorService.uploadPhoto(secureUrl, doctorId);
      return { message: 'The image has been changed successfully' };
    }
    @UseGuards(JwtGuard)
    @Put('user/photo')
    @UseInterceptors(FileInterceptor('photo'))
    async useruploadPhoto(
      @Request() req,
      @UploadedFile() image: Express.Multer.File,
    ): Promise<{ message: string }> {
      const userId = req.user.id;
      const secureUrl = await this.cloudinaryService.uploadFile(image);
      await this.userService.uploadPhoto(secureUrl, userId);
      return { message: 'The image has been changed successfully' };
    }
  }
  