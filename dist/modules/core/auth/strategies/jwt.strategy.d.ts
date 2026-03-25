import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
export interface JwtPayload {
    sub: string;
    schoolId: string | null;
    schoolCode?: string | null;
    role: string;
    cv?: number;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private configService;
    private usersRepository;
    constructor(configService: ConfigService, usersRepository: Repository<User>);
    validate(payload: JwtPayload): Promise<{
        id: string;
        schoolId: string | null;
        schoolCode: string | null;
        role: import("../../../../common/enums/user-role.enum").UserRole;
    }>;
}
export {};
