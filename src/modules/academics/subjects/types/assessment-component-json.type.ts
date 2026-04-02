import type { AssessmentComponentType } from '../enums/assessment-component-type.enum';

/** One row inside `subject_assessment_profiles.components` JSONB (Option A). */
export type AssessmentComponentJson = {
  name: string;
  weight: number;
  type: AssessmentComponentType;
  best_of_x?: number;
};
