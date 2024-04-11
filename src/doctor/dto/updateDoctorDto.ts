import { CreateDoctorDto } from "./createDoctorDto";
import {PartialType} from "@nestjs/mapped-types";
export class UpdateDoctorDto extends PartialType(CreateDoctorDto){
    photo?:string;//تخزن في صيغة base64 لترميز الصور
}