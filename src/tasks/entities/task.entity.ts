import { 
  Column, 
  Entity, 
  PrimaryGeneratedColumn, 
  ManyToOne, 
  ManyToMany, 
  JoinTable,
  OneToMany,
  CreateDateColumn,
  JoinColumn
} from "typeorm";
import { User } from "src/users/entities/user.entity";
import { Comment } from '../comments/entities/comment.entity';
import { FileAttachment } from "./file-attachemnt.entity";

export enum Status {
  IN_WORK = 'in_work',
  PAUSED = 'paused',
  COMPLETED = 'completed'
}

export enum Priority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({
    type: 'enum',
    enum: Status,
    default: Status.IN_WORK
  })
  status: Status;

  @Column({
    type: 'enum',
    enum: Priority,
    default: Priority.MEDIUM
  })
  priority: Priority;

  @Column({ type: 'timestamp', nullable: true })
  dateStart: Date;

  @Column({ type: 'timestamp', nullable: true })
  dateEnd: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, user => user.createdTasks)
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @Column()
  creatorId: number;

  @ManyToMany(() => User, user => user.assignedTasks)
  @JoinTable({
    name: 'task_participants',
    joinColumn: {
      name: 'taskId',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'userId',
      referencedColumnName: 'id'
    }
  })
  participants: User[];

  @OneToMany(() => Comment, comment => comment.task)
  comments: Comment[];

  @OneToMany(() => FileAttachment, file => file.task)
  files: FileAttachment[];

  commentCount?: number;
  fileCount?: number;

  constructor(partial?: Partial<Task>) {
    Object.assign(this, partial);
  }
}