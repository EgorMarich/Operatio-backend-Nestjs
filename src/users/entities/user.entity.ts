import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Task } from 'src/tasks/entities/task.entity';
import { Company } from 'src/companies/entities/company.entity';

export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ default: 'https://i.pravatar.cc/300'})
  avatar: string

  @Column({ length: 24 })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @Column({
    default: 0,
  })
  authMethod: number;

  @Column({ type: 'date', nullable: true })
  birthDate: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => Company, company => company.employees)
  company: Company;

  @Column({ nullable: true })
  companyId: number;

  @OneToMany(() => Task, task => task.creator)
  createdTasks: Task[];

  @ManyToMany(() => Task, task => task.participants)
  assignedTasks: Task[];
}
