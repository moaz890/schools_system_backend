import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { School } from './entities/school.entity';
import { SchoolsService } from './schools.service';
import { SchoolsController } from './schools.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([School]),
        MulterModule.register({ dest: './uploads' }),
    ],
    controllers: [SchoolsController],
    providers: [SchoolsService],
    exports: [SchoolsService], // exported so other modules can inject it
})
export class SchoolsModule { }
