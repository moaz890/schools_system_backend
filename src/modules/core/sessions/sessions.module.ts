import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './entities/session.entity';
import { User } from '../users/entities/user.entity';
import { SessionsService } from './sessions.service';
import { SessionAccessPolicy } from './policies/session-access.policy';
import { UserSessionsController } from './user-sessions.controller';
import { RevokeSessionController } from './revoke-session.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Session, User])],
    controllers: [UserSessionsController, RevokeSessionController],
    providers: [SessionsService, SessionAccessPolicy],
    exports: [SessionsService, TypeOrmModule.forFeature([Session])],
})
export class SessionsModule {}
