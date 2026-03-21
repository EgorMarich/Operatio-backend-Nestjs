import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from "typeorm";
import { Task } from "../../entities/task.entity";
import { User } from "src/users/entities/user.entity";

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Task, task => task.comments, { onDelete: 'CASCADE' })
  task: Task;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  authorId: number;
}