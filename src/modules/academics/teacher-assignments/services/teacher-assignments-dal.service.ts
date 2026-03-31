import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeacherAssignment } from '../entities/teacher-assignment.entity';
import { ClassSection } from '../../classes/entities/class.entity';
import { GradeLevelSubject } from '../../grade-levels/entities/grade-level-subject.entity';
import { TeacherSubjectSpecialization } from '../entities/teacher-subject-specialization.entity';

@Injectable()
export class TeacherAssignmentsDalService {
  constructor(
    @InjectRepository(TeacherAssignment)
    private readonly assignmentRepo: Repository<TeacherAssignment>,
    @InjectRepository(ClassSection)
    private readonly classRepo: Repository<ClassSection>,
    @InjectRepository(GradeLevelSubject)
    private readonly gradeLevelSubjectRepo: Repository<GradeLevelSubject>,
    @InjectRepository(TeacherSubjectSpecialization)
    private readonly specializationRepo: Repository<TeacherSubjectSpecialization>,
  ) {}

  findClassWithGradeForSchool(classId: string, schoolId: string) {
    return this.classRepo.findOne({
      where: { id: classId, schoolId },
      relations: ['gradeLevel'],
    });
  }

  findCurriculumLink(gradeLevelId: string, subjectId: string) {
    return this.gradeLevelSubjectRepo.findOne({
      where: { gradeLevelId, subjectId },
    });
  }

  findActiveSpecialization(
    schoolId: string,
    teacherId: string,
    subjectId: string,
  ) {
    return this.specializationRepo.findOne({
      where: { schoolId, teacherId, subjectId },
    });
  }

  countActiveDuplicate(params: {
    schoolId: string;
    teacherId: string;
    classId: string;
    subjectId: string;
  }) {
    return this.assignmentRepo.count({
      where: {
        schoolId: params.schoolId,
        teacherId: params.teacherId,
        classId: params.classId,
        subjectId: params.subjectId,
        isActive: true,
      } as any,
    });
  }

  saveAssignment(row: TeacherAssignment) {
    return this.assignmentRepo.save(row);
  }

  createAssignment(partial: Partial<TeacherAssignment>) {
    return this.assignmentRepo.create(partial as TeacherAssignment);
  }

  findAssignmentById(schoolId: string, id: string) {
    return this.assignmentRepo.findOne({
      where: { id, schoolId },
      relations: ['teacher', 'subject'],
    });
  }

  listAssignmentsForClass(schoolId: string, classId: string) {
    return this.assignmentRepo.find({
      where: { schoolId, classId } as any,
      relations: ['teacher', 'subject'],
      order: { startDate: 'DESC' } as any,
    });
  }
}
