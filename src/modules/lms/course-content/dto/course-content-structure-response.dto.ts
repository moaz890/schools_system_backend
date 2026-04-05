import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseStructureKind } from '../enums/course-structure-kind.enum';
import { LessonContentType } from '../enums/lesson-content-type.enum';

export class ContentItemSnippetDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  position: number;

  @ApiProperty({ enum: LessonContentType })
  contentType: LessonContentType;

  @ApiProperty()
  isRequired: boolean;

  @ApiProperty({ type: 'object', additionalProperties: true })
  payload: Record<string, unknown>;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class CourseLessonSnippetDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  position: number;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  title: Record<string, string>;

  @ApiPropertyOptional({
    nullable: true,
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  description: Record<string, string> | null;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description: 'Set when lesson belongs to a unit (nested mode)',
  })
  unitId: string | null;

  @ApiProperty({ type: [ContentItemSnippetDto] })
  contentItems: ContentItemSnippetDto[];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class CourseUnitSnippetDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  position: number;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  title: Record<string, string>;

  @ApiPropertyOptional({
    nullable: true,
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  description: Record<string, string> | null;

  @ApiProperty({ type: [CourseLessonSnippetDto] })
  lessons: CourseLessonSnippetDto[];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

/** Embedded on GET /courses/:id when structure exists. */
export class CourseContentStructureDto {
  @ApiPropertyOptional({
    enum: CourseStructureKind,
    nullable: true,
    description: 'null = empty structure',
  })
  structureKind: CourseStructureKind | null;

  @ApiProperty({
    type: [CourseUnitSnippetDto],
    description: 'Populated in nested mode',
  })
  units: CourseUnitSnippetDto[];

  @ApiProperty({
    type: [CourseLessonSnippetDto],
    description: 'Root lessons in flat mode; empty in nested mode',
  })
  rootLessons: CourseLessonSnippetDto[];
}
