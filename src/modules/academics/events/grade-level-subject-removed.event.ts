export class GradeLevelSubjectRemovedEvent {
  constructor(
    public readonly schoolId: string,
    public readonly gradeLevelId: string,
    public readonly subjectId: string,
    public readonly gradeLevelSubjectLinkId: string,
  ) {}
}
