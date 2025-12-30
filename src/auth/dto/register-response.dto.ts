import { User } from '../../users/entities/user.entity';
import { Company } from '../../companies/entities/company.entity';

export class RegisterResponseDto {
  user: User;
  company: Company;
}