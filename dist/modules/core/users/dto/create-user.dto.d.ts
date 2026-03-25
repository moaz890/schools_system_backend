import { NationalIdType } from '../entities/user.entity';
export declare class CreateUserDto {
    schoolId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    nationalId: string;
    nationalIdType?: NationalIdType;
}
