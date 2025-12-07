import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { Company } from './company.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('company_invitations')
export class CompanyInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Index()
  @Column()
  token: string;

  @Column({ 
    type: 'enum', 
    enum: ['owner', 'admin', 'manager', 'employee'], 
    default: 'employee' 
  })
  role: string;

  @Column({ 
    type: 'enum',
    enum: ['pending', 'accepted', 'expired', 'cancelled'],
    default: 'pending'
  })
  status: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User)
  inviter: User;

  @Column()
  inviterId: number;

  @ManyToOne(() => Company, company => company.invitations)
  company: Company;

  @Column()
  companyId: number;

  @ManyToOne(() => User, { nullable: true })
  acceptedBy: User;

  @Column({ nullable: true })
  acceptedById: number;

  @Column({ type: 'timestamp', nullable: true })
  acceptedAt: Date;
}