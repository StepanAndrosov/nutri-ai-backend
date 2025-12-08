import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SignupInputModel } from './models/input/signup.input.model';
import { LoginInputModel } from './models/input/login.input.model';
import { AuthOutputModel } from './models/output/auth.output.model';
import { UsersService } from '../../user-accounts/application/users.service';
import { UsersQueryRepository } from '../../user-accounts/infrastructure/users.query-repository';
import { AuthService } from '../application/auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { UserOutputModel } from '../../user-accounts/api/models/output/user.output.model';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';
import { CurrentUserType } from './types/request-with-user.type';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
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

    // Generate JWT access token
    const token = await this.authService.generateAccessToken(user.id, user.email);

    return {
      token,
      user,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginData: LoginInputModel): Promise<AuthOutputModel> {
    const { email, password } = loginData;

    // Find user by email
    const user = await this.usersQueryRepository.getByEmail(email);
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Invalid email or password',
      });
    }

    // Verify password
    const isPasswordValid = await this.authService.comparePasswords(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Invalid email or password',
      });
    }

    // Generate JWT access token
    const token = await this.authService.generateAccessToken(user.id, user.email);

    return {
      token,
      user,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async getCurrentUser(@CurrentUser() currentUser: CurrentUserType): Promise<UserOutputModel> {
    return await this.usersQueryRepository.getByIdOrNotFoundFail(currentUser.userId);
  }
}
