export class MandatoryCourseLinkedToClassEvent {
  constructor(
    public readonly schoolId: string,
    public readonly courseId: string,
    public readonly classId: string,
  ) {}
}
