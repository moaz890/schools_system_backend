import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { School } from '../schools/entities/school.entity';
import { SessionsService } from '../sessions/sessions.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserRole } from '../../../common/enums/user-role.enum';
import { AppLoggerService } from '../logger/logger.service';
import { EmailService } from '../email/email.service';
export declare class AuthService {
    private usersRepository;
    private schoolsRepository;
    private sessionsService;
    private logger;
    private jwtService;
    private configService;
    private emailService;
    constructor(usersRepository: Repository<User>, schoolsRepository: Repository<School>, sessionsService: SessionsService, logger: AppLoggerService, jwtService: JwtService, configService: ConfigService, emailService: EmailService);
    login(loginDto: LoginDto, deviceInfo?: string, ipAddress?: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: any;
            email: string;
            firstName: string;
            lastName: string;
            role: UserRole;
            schoolId: string | null;
            schoolCode: string | null;
        };
    }>;
    private resolveUserForLogin;
    refresh(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string, refreshToken: string): Promise<{
        message: string;
    }>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    private resolveUserForPasswordReset;
    private generateTokens;
    private handleFailedLogin;
}
