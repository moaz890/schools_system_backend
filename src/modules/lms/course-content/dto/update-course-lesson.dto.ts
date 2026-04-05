import { PartialType, PickType } from '@nestjs/swagger';
import { CreateCourseLessonDto } from './create-course-lesson.dto';

export class UpdateCourseLessonDto extends PartialType(
  PickType(CreateCourseLessonDto, ['title', 'description'] as const),
) {}
