import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { User } from './entities/user.entity';
import { ParentStudent } from './entities/parent-student.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, ParentStudent]),
        MulterModule.register({ dest: './uploads' }),
    ],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService, TypeOrmModule], // export TypeOrmModule so School analytics can use UserRepo
})
export class UsersModule { }
