import { BaseEntity } from '../../../../common/entities/base.entity';
import { User } from './user.entity';
export declare enum ParentRelationship {
    FATHER = "father",
    MOTHER = "mother",
    GUARDIAN = "guardian"
}
export declare class ParentStudent extends BaseEntity {
    parentId: string;
    parent: User;
    studentId: string;
    student: User;
    relationship: ParentRelationship;
}
