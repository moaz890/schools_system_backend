export class StudentEnrolledEvent {
  constructor(
    public readonly schoolId: string,
    public readonly enrollmentId: string,
    public readonly studentId: string,
    public readonly classId: string,
    public readonly academicYearId: string,
    public readonly gradeLevelId: string,
  ) {}
}
