import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ParentRelationship } from '../entities/parent-student.entity';

export class LinkParentStudentDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsUUID('4')
    studentId: string;

    @ApiProperty({ enum: ParentRelationship })
    @IsNotEmpty()
    @IsEnum(ParentRelationship)
    relationship: ParentRelationship;
}
