import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { School } from './entities/school.entity';
import { SchoolsService } from './schools.service';
import { SchoolsController } from './schools.controller';
import { SchoolStrategiesModule } from '../school-strategies/school-strategies.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([School]),
        MulterModule.register({ dest: './uploads' }),
        SchoolStrategiesModule,
    ],
    controllers: [SchoolsController],
    providers: [SchoolsService],
    exports: [SchoolsService],
})
export class SchoolsModule { }
