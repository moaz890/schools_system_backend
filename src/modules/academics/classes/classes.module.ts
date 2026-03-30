import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassSection } from './entities/class.entity';
import { ClassesService } from './services/classes.service';
import { ClassesDalService } from './services/classes-dal.service';
import { ClassesHelpersService } from './services/classes-helpers.service';
import { ClassesController } from './controllers/classes.controller';
import { GradeLevel } from '../grade-levels/entities/grade-level.entity';
import { AcademicYear } from '../../core/academic-years/entities/academic-year.entity';
import { User } from '../../core/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClassSection, GradeLevel, AcademicYear, User])],
  controllers: [ClassesController],
  providers: [ClassesDalService, ClassesHelpersService, ClassesService],
  exports: [ClassesService],
})
export class ClassesModule {}

