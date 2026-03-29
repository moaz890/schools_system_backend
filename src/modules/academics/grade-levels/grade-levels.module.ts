import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GradeLevel } from './entities/grade-level.entity';
import { GradeLevelsService } from './grade-levels.service';
import { GradeLevelsController } from './grade-levels.controller';
import { StagesModule } from '../stages/stages.module';

@Module({
  imports: [TypeOrmModule.forFeature([GradeLevel]), StagesModule],
  controllers: [GradeLevelsController],
  providers: [GradeLevelsService],
  exports: [GradeLevelsService],
})
export class GradeLevelsModule {}
