import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class UpsertTeacherSpecializationDto {
  @ApiPropertyOptional({
    description:
      'Optional. If provided, must match :teacherId in the URL. Also useful for clients that prefer sending IDs in the body.',
    type: String,
  })
  @IsOptional()
  @IsUUID('4')
  teacherId?: string;

  @ApiPropertyOptional({
    description:
      'Optional. If provided, must match :subjectId in the URL. Also useful for clients that prefer sending IDs in the body.',
    type: String,
  })
  @IsOptional()
  @IsUUID('4')
  subjectId?: string;

  @ApiPropertyOptional({
    description:
      'If omitted/null/empty → teacher may teach this subject in all stages. Otherwise restrict to these stage IDs.',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  allowedStageIds?: string[] | null;
}

