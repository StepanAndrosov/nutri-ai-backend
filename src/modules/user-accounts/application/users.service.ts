import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/users.repository';
import { AuthService } from '../../auth/application/auth.service';

// Для провайдера всегда необходимо применять декоратор @Injectable() и регистрировать в модуле
@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly authService: AuthService,
  ) {}

  async create(login: string, password: string, email: string): Promise<string> {
    const generatedPasswordHash = await this.authService.generatePasswordHash(password);

    const newUser = {
      login: login,
      passwordHash: generatedPasswordHash,
      email: email,
      createdAt: new Date(),
    };

    const createdUserId: string = await this.usersRepository.create(newUser);

    return createdUserId;
  }

  async delete(id: string): Promise<boolean> {
    return this.usersRepository.delete(id);
  }
}
