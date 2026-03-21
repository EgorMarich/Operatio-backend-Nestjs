import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, OneToMany, CreateDateColumn
} from 'typeorm';
import { Company } from 'src/companies/entities/company.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  // Вложенность: отдел может быть внутри другого отдела
  @ManyToOne(() => Department, d => d.children, { nullable: true, onDelete: 'SET NULL' })
  parent: Department;

  @Column({ nullable: true })
  parentId: number;

  @OneToMany(() => Department, d => d.parent)
  children: Department[];

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  company: Company;

  @Column()
  companyId: number;

  // Руководитель отдела
  @ManyToOne(() => User, { nullable: true })
  head: User;

  @Column({ nullable: true })
  headId: number;

  @OneToMany(() => User, user => user.department)
  members: User[];

  @CreateDateColumn()
  createdAt: Date;
}