import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Course } from '../entities/course.entity';
import {
  CourseAcademicYearSnippetDto,
  CourseClassSnippetDto,
  CourseGradeLevelSnippetDto,
  CourseResponseDto,
  CourseSubjectSnippetDto,
  CourseTeacherSnippetDto,
} from '../dto/course-response.dto';

@Injectable()
export class CoursesResponseMapperService {
  toCourseResponse(course: Course): CourseResponseDto {
    const teacher = this.toTeacherSnippet(course);
    const subject = this.toSubjectSnippet(course);
    const classSection = this.toClassSnippet(course);

    if (!teacher || !subject || !classSection) {
      throw new InternalServerErrorException(
        'Course response requires teacher, subject, and classSection (with gradeLevel and academicYear) relations',
      );
    }

    return {
      id: course.id,
      classId: course.classId,
      subjectId: course.subjectId,
      teacherId: course.teacherId,
      description: course.description as Record<string, string> | null,
      objectives: course.objectives as Record<string, string> | null,
      durationLabel: course.durationLabel,
      startDate: course.startDate,
      endDate: course.endDate,
      sequentialLearningEnabled: course.sequentialLearningEnabled,
      isPublished: course.isPublished,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      teacher,
      subject,
      classSection,
    };
  }

  toCourseResponseList(courses: Course[]): CourseResponseDto[] {
    return courses.map((c) => this.toCourseResponse(c));
  }

  private toTeacherSnippet(course: Course): CourseTeacherSnippetDto | null {
    const t = course.teacher;
    if (!t) return null;
    return {
      id: t.id,
      name: t.name as Record<string, string>,
      avatarUrl: t.avatarUrl ?? null,
    };
  }

  private toSubjectSnippet(course: Course): CourseSubjectSnippetDto | null {
    const s = course.subject;
    if (!s) return null;
    return {
      id: s.id,
      code: s.code,
      name: s.name as Record<string, string>,
    };
  }

  private toClassSnippet(course: Course): CourseClassSnippetDto | null {
    const c = course.classSection;
    if (!c?.academicYear || !c.gradeLevel) return null;

    const academicYear: CourseAcademicYearSnippetDto = {
      id: c.academicYear.id,
      name: c.academicYear.name as Record<string, string>,
      startDate: c.academicYear.startDate,
      endDate: c.academicYear.endDate,
      isCurrent: c.academicYear.isCurrent,
    };

    const gradeLevel: CourseGradeLevelSnippetDto = {
      id: c.gradeLevel.id,
      name: c.gradeLevel.name as Record<string, string>,
      order: c.gradeLevel.order,
    };

    return {
      id: c.id,
      sectionLetter: c.sectionLetter,
      name: c.name as Record<string, string>,
      gradeLevel,
      academicYear,
    };
  }
}
