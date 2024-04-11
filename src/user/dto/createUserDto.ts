import { IsString,  IsNumberString ,IsNotEmpty, IsMobilePhone, MaxLength, IsStrongPassword} from "class-validator";

export class CreateUserDto{
    @IsNumberString()
    @IsMobilePhone('ar-SY')
    @IsNotEmpty({message: 'This field should not be empty'})
    phone:string;

    @IsString({message: 'This field must be a string'})
    @IsNotEmpty({message: 'This field should not be empty'})
    @MaxLength(30)
    name:string;

    @IsNotEmpty({message: 'This field should not be empty'})
    @IsString()
    @MaxLength(20)
    @IsStrongPassword({
        minLength:8,
        minLowercase:1,
        minUppercase:1,
        minNumbers:1,
        minSymbols:1,
    })
    password:string;

    @IsNotEmpty({message: 'This field should not be empty'})
    governorate:string;

}