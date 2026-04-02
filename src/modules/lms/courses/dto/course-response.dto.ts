import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Assigned teacher: display fields only (no credentials or national id). */
export class CourseTeacherSnippetDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({
    example: { en: 'Ahmed Rashid', ar: 'أحمد راشد' },
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  name: Record<string, string>;

  @ApiPropertyOptional({ nullable: true, example: null })
  avatarUrl: string | null;
}

export class CourseSubjectSnippetDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'MATH' })
  code: string;

  @ApiProperty({
    example: { en: 'Mathematics', ar: 'الرياضيات' },
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  name: Record<string, string>;
}

export class CourseGradeLevelSnippetDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  name: Record<string, string>;

  @ApiProperty({ example: 3 })
  order: number;
}

export class CourseAcademicYearSnippetDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  name: Record<string, string>;

  @ApiProperty({ type: String, format: 'date-time' })
  startDate: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  endDate: Date;

  @ApiProperty()
  isCurrent: boolean;
}

/** Class context for a course: identifiers + labels only (no homeroom / capacity here). */
export class CourseClassSnippetDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'A' })
  sectionLetter: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  name: Record<string, string>;

  @ApiProperty({ type: CourseGradeLevelSnippetDto })
  gradeLevel: CourseGradeLevelSnippetDto;

  @ApiProperty({ type: CourseAcademicYearSnippetDto })
  academicYear: CourseAcademicYearSnippetDto;
}

export class CourseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  classId: string;

  @ApiProperty({ format: 'uuid' })
  subjectId: string;

  @ApiProperty({ format: 'uuid' })
  teacherId: string;

  @ApiPropertyOptional({
    nullable: true,
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  description: Record<string, string> | null;

  @ApiPropertyOptional({
    nullable: true,
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  objectives: Record<string, string> | null;

  @ApiPropertyOptional({ nullable: true })
  durationLabel: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  startDate: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  endDate: Date;

  @ApiProperty()
  sequentialLearningEnabled: boolean;

  @ApiProperty()
  isPublished: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  @ApiProperty({ type: CourseTeacherSnippetDto })
  teacher: CourseTeacherSnippetDto;

  @ApiProperty({ type: CourseSubjectSnippetDto })
  subject: CourseSubjectSnippetDto;

  @ApiProperty({ type: CourseClassSnippetDto })
  classSection: CourseClassSnippetDto;
}
