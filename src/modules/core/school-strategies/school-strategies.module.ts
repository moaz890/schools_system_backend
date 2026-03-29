import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolStrategy } from './entities/school-strategy.entity';
import { SchoolStrategiesService } from './school-strategies.service';
import { SchoolStrategiesController } from './school-strategies.controller';

@Module({
    imports: [TypeOrmModule.forFeature([SchoolStrategy])],
    controllers: [SchoolStrategiesController],
    providers: [SchoolStrategiesService],
    exports: [SchoolStrategiesService], // exported so SchoolsService can call initForSchool
})
export class SchoolStrategiesModule { }
