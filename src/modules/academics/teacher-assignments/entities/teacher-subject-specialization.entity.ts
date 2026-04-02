import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { School } from '../../../core/schools/entities/school.entity';
import { User } from '../../../core/users/entities/user.entity';
import { Subject } from '../../subjects/entities/subject.entity';

@Entity('teacher_subject_specializations')
@Index(
  'UQ_teacher_subject_specializations_pair',
  ['schoolId', 'teacherId', 'subjectId'],
  {
    unique: true,
    where: '"deleted_at" IS NULL',
  },
)
export class TeacherSubjectSpecialization extends BaseEntity {
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @ManyToOne(() => School, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: School;

  @Column({ name: 'teacher_id', type: 'uuid' })
  teacherId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;

  @Column({ name: 'subject_id', type: 'uuid' })
  subjectId: string;

  @ManyToOne(() => Subject, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  /** UUID strings; stored as PostgreSQL `text[]` so TypeORM/pg bind arrays reliably. */
  @Column({
    name: 'allowed_stage_ids',
    type: 'text',
    array: true,
    nullable: true,
  })
  allowedStageIds: string[] | null;
}
