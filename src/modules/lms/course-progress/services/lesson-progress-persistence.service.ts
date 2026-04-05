import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LessonProgress } from '../entities/lesson-progress.entity';

@Injectable()
export class LessonProgressPersistenceService {
  constructor(
    @InjectRepository(LessonProgress)
    private readonly repo: Repository<LessonProgress>,
  ) {}

  findByEnrollmentAndLesson(
    courseEnrollmentId: string,
    lessonId: string,
  ): Promise<LessonProgress | null> {
    return this.repo.findOne({
      where: { courseEnrollmentId, lessonId },
    });
  }

  findAllByEnrollment(courseEnrollmentId: string): Promise<LessonProgress[]> {
    return this.repo.find({ where: { courseEnrollmentId } });
  }

  async ensureRow(
    courseEnrollmentId: string,
    lessonId: string,
  ): Promise<LessonProgress> {
    let row = await this.findByEnrollmentAndLesson(courseEnrollmentId, lessonId);
    if (!row) {
      row = this.repo.create({
        courseEnrollmentId,
        lessonId,
        completionPercentage: 0,
        timeSpentSeconds: 0,
        videoSecondsWatched: 0,
      });
      try {
        row = await this.repo.save(row);
      } catch (e: any) {
        if (e?.code === '23505') {
          row = (await this.findByEnrollmentAndLesson(
            courseEnrollmentId,
            lessonId,
          ))!;
        } else {
          throw e;
        }
      }
    }
    return row;
  }

  async save(row: LessonProgress): Promise<LessonProgress> {
    return this.repo.save(row);
  }
}
