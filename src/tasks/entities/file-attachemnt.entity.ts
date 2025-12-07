import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from "typeorm";
import { Task } from "./task.entity";
import { User } from "src/users/entities/user.entity";

@Entity()
export class FileAttachment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filename: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column()
  size: number;

  @Column()
  path: string;

  @CreateDateColumn()
  uploadedAt: Date;

  @ManyToOne(() => Task, task => task.files, { onDelete: 'CASCADE' })
  task: Task;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User;

  @Column()
  uploadedById: number;
}