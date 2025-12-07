import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SignupInputModel } from './models/input/signup.input.model';
import { AuthOutputModel } from './models/output/auth.output.model';
import { UsersService } from '../../user-accounts/application/users.service';
import { UsersQueryRepository } from '../../user-accounts/infrastructure/users.query-repository';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() signupData: SignupInputModel): Promise<AuthOutputModel> {
    const { email, password, displayName, timezone } = signupData;

    // Check if user already exists
    const existingUser = await this.usersQueryRepository.getByEmail(email);
    if (existingUser) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'User with this email already exists',
      });
    }

    // Create new user
    const createdUserId = await this.usersService.create(
      email,
      password,
      displayName,
      timezone,
      0, // dailyKcalGoal
    );

    // Get created user
    const user = await this.usersQueryRepository.getByIdOrNotFoundFail(createdUserId);

    // TODO: Generate JWT token
    const token = 'temporary-token'; // Will be replaced with actual JWT

    return {
      token,
      user,
    };
  }
}
