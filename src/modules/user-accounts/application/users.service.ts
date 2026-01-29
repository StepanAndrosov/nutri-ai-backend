import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/users.repository';
import { AuthService } from '../../auth/application/auth.service';
import { UserRole } from '../../auth/domain/user-role.enum';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

// Для провайдера всегда необходимо применять декоратор @Injectable() и регистрировать в модуле
@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly authService: AuthService,
  ) {}

  async create(
    email: string,
    password: string,
    displayName?: string,
    timezone?: string,
    dailyKcalGoal?: number,
  ): Promise<string> {
    const generatedPasswordHash = await this.authService.generatePasswordHash(password);

    const newUser = {
      email: email,
      passwordHash: generatedPasswordHash,
      authProvider: 'local' as const,
      displayName: displayName,
      role: UserRole.USER,
      timezone: timezone,
      dailyKcalGoal: dailyKcalGoal,
      createdAt: new Date(),
    };

    const createdUserId: string = await this.usersRepository.create(newUser);

    return createdUserId;
  }

  async updateRole(userId: string, role: UserRole): Promise<void> {
    const updated = await this.usersRepository.updateRole(userId, role);
    if (!updated) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'User not found',
      });
    }
  }

  async delete(id: string): Promise<boolean> {
    return this.usersRepository.delete(id);
  }

  async createFromGoogle(
    email: string,
    googleId: string,
    displayName?: string,
    timezone?: string,
  ): Promise<string> {
    const newUser = {
      email: email,
      googleId: googleId,
      authProvider: 'google' as const,
      displayName: displayName,
      role: UserRole.USER,
      timezone: timezone,
      dailyKcalGoal: 0,
      createdAt: new Date(),
    };

    const createdUserId: string = await this.usersRepository.create(newUser);

    return createdUserId;
  }
}
