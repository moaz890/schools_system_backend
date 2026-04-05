import { PartialType, PickType } from '@nestjs/swagger';
import { CreateCourseUnitDto } from './create-course-unit.dto';

export class UpdateCourseUnitDto extends PartialType(
  PickType(CreateCourseUnitDto, ['title', 'description'] as const),
) {}
