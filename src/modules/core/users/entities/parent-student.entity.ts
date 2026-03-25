import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { User } from './user.entity';

export enum ParentRelationship {
    FATHER = 'father',
    MOTHER = 'mother',
    GUARDIAN = 'guardian',
}

@Entity('parent_student')
export class ParentStudent extends BaseEntity {
    @Column({ name: 'parent_id', type: 'uuid' })
    parentId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'parent_id' })
    parent: User;

    @Column({ name: 'student_id', type: 'uuid' })
    studentId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'student_id' })
    student: User;

    @Column({
        type: 'enum',
        enum: ParentRelationship,
        default: ParentRelationship.GUARDIAN,
    })
    relationship: ParentRelationship;
}
