import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { AssessmentComponentDto } from './assessment-component.dto';

export class UpsertAssessmentProfileDto {
  @ApiProperty({
    type: [AssessmentComponentDto],
    description:
      'Weights must sum to 100. Multiple rows may share the same type (e.g. midterm and final as EXAM).',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AssessmentComponentDto)
  components: AssessmentComponentDto[];
}
