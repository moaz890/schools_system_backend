import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersDalService } from './services/users-dal.service';
import { UsersCreateService } from './services/users-create.service';
import { UsersQueryService } from './services/users-query.service';
import { UsersProfileService } from './services/users-profile.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        MulterModule.register({ dest: './uploads' }),
    ],
    controllers: [UsersController],
    providers: [
        UsersService,
        UsersDalService,
        UsersCreateService,
        UsersQueryService,
        UsersProfileService,
    ],
    exports: [UsersService, UsersCreateService, TypeOrmModule], // UsersCreateService exported for other modules
})
export class UsersModule { }
