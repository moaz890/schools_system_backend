import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from '../courses/entities/course.entity';
import { CourseUnit } from './entities/course-unit.entity';
import { CourseLesson } from './entities/course-lesson.entity';
import { ContentItem } from './entities/content-item.entity';
import { CourseContentController } from './course-content.controller';
import { CourseContentDalService } from './services/course-content-dal.service';
import { CourseContentSharedService } from './services/course-content-shared.service';
import { CourseContentUnitsService } from './services/course-content-units.service';
import { CourseContentLessonsService } from './services/course-content-lessons.service';
import { CourseContentItemsService } from './services/course-content-items.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Course, CourseUnit, CourseLesson, ContentItem]),
  ],
  controllers: [CourseContentController],
  providers: [
    CourseContentDalService,
    CourseContentSharedService,
    CourseContentUnitsService,
    CourseContentLessonsService,
    CourseContentItemsService,
  ],
  exports: [CourseContentSharedService, CourseContentDalService],
})
export class CourseContentModule {}
