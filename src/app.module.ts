import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import mailConfig from './config/mail.config';

import { DatabaseModule } from './database/database.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { SchoolsModule } from './modules/core/schools/schools.module';
import { AuthModule } from './modules/core/auth/auth.module';
import { UsersModule } from './modules/core/users/users.module';
import { LoggerModule } from './modules/core/logger/logger.module';
import { AcademicYearsModule } from './modules/core/academic-years/academic-years.module';
import { AcademicsModule } from './modules/academics/academics.module';
import { SchoolStrategiesModule } from './modules/core/school-strategies/school-strategies.module';



@Module({
  imports: [
    // Global config — load all config namespaces
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, mailConfig],
      envFilePath: '.env',
    }),

    // Database
    DatabaseModule,

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120,
      },
    ]),

    // Feature modules
    LoggerModule,
    SchoolsModule,
    AuthModule,
    UsersModule,
    AcademicYearsModule,
    AcademicsModule,
    SchoolStrategiesModule,

    // Coming soon:
    // AcademicsModule, LmsModule, AssessmentsModule
    // GradingModule, AttendanceModule, SchedulingModule, CommunicationModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Apply JWT guard globally — all routes require auth unless @Public()
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Apply roles guard globally — enforces @Roles() decorator
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // Wrap all responses in our standard format
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    // Catch all errors and format them consistently
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule { }
