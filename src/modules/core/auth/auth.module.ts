import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { School } from '../schools/entities/school.entity';
import { SessionsModule } from '../sessions/sessions.module';
import { AuthService } from './services/auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { EmailModule } from '../email/email.module';
import { AuthDalService } from './services/auth-dal.service';
import { AuthPasswordService } from './services/auth-password.service';
import { AuditLogModule } from '../audit/audit-log.module';

@Module({
    imports: [
        EmailModule,
        AuditLogModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('jwt.accessSecret') ?? '',
                signOptions: { expiresIn: configService.get<string>('jwt.accessExpiresIn') as any },
            }),
            inject: [ConfigService],
        }),
        SessionsModule,
        TypeOrmModule.forFeature([User, School]),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, AuthDalService, AuthPasswordService],
    exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule { }
