/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { UsersService } from '../../user-accounts/application/users.service';
import { UsersQueryRepository } from '../../user-accounts/infrastructure/users.query-repository';
import { SignupInputModel } from './models/input/signup.input.model';
import { AuthOutputModel } from './models/output/auth.output.model';
import { UserOutputModel } from '../../user-accounts/api/models/output/user.output.model';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

describe('AuthController', () => {
  let controller: AuthController;
  let usersService: UsersService;
  let usersQueryRepository: UsersQueryRepository;

  // Mock data factory
  const createMockUserOutput = (overrides?: Partial<UserOutputModel>): UserOutputModel => {
    return {
      id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      passwordHash: '$2b$10$hashedPassword123',
      displayName: 'Test User',
      timezone: 'UTC',
      dailyKcalGoal: 2000,
      createdAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
      ...overrides,
    };
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: UsersQueryRepository,
          useValue: {
            getByEmail: jest.fn(),
            getByIdOrNotFoundFail: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    usersService = module.get<UsersService>(UsersService);
    usersQueryRepository = module.get<UsersQueryRepository>(UsersQueryRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    it('should successfully register a new user with all fields', async () => {
      // Arrange
      const signupData: SignupInputModel = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        displayName: 'New User',
        timezone: 'Europe/London',
      };
      const createdUserId = '507f1f77bcf86cd799439012';
      const mockUser = createMockUserOutput({
        id: createdUserId,
        email: signupData.email,
        displayName: signupData.displayName,
        timezone: signupData.timezone,
      });

      jest.spyOn(usersQueryRepository, 'getByEmail').mockResolvedValue(null);
      jest.spyOn(usersService, 'create').mockResolvedValue(createdUserId);
      jest.spyOn(usersQueryRepository, 'getByIdOrNotFoundFail').mockResolvedValue(mockUser);

      // Act
      const result: AuthOutputModel = await controller.signup(signupData);

      // Assert
      expect(result).toBeDefined();
      expect(result.token).toBe('temporary-token');
      expect(result.user).toEqual(mockUser);
      expect(result.user.email).toBe(signupData.email);
      expect(result.user.displayName).toBe(signupData.displayName);
      expect(result.user.timezone).toBe(signupData.timezone);

      expect(usersQueryRepository.getByEmail).toHaveBeenCalledTimes(1);
      expect(usersQueryRepository.getByEmail).toHaveBeenCalledWith(signupData.email);
      expect(usersService.create).toHaveBeenCalledTimes(1);
      expect(usersService.create).toHaveBeenCalledWith(
        signupData.email,
        signupData.password,
        signupData.displayName,
        signupData.timezone,
        0,
      );
      expect(usersQueryRepository.getByIdOrNotFoundFail).toHaveBeenCalledTimes(1);
      expect(usersQueryRepository.getByIdOrNotFoundFail).toHaveBeenCalledWith(createdUserId);
    });

    it('should successfully register a new user with only required fields', async () => {
      // Arrange
      const signupData: SignupInputModel = {
        email: 'minimal@example.com',
        password: 'Password123!',
      };
      const createdUserId = '507f1f77bcf86cd799439013';
      const mockUser = createMockUserOutput({
        id: createdUserId,
        email: signupData.email,
        displayName: undefined,
        timezone: undefined,
      });

      jest.spyOn(usersQueryRepository, 'getByEmail').mockResolvedValue(null);
      jest.spyOn(usersService, 'create').mockResolvedValue(createdUserId);
      jest.spyOn(usersQueryRepository, 'getByIdOrNotFoundFail').mockResolvedValue(mockUser);

      // Act
      const result: AuthOutputModel = await controller.signup(signupData);

      // Assert
      expect(result).toBeDefined();
      expect(result.token).toBe('temporary-token');
      expect(result.user.email).toBe(signupData.email);
      expect(result.user.displayName).toBeUndefined();
      expect(result.user.timezone).toBeUndefined();

      expect(usersService.create).toHaveBeenCalledWith(
        signupData.email,
        signupData.password,
        undefined,
        undefined,
        0,
      );
    });

    it('should throw DomainException with BadRequest when email already exists', async () => {
      // Arrange
      const signupData: SignupInputModel = {
        email: 'existing@example.com',
        password: 'Password123!',
        displayName: 'Existing User',
        timezone: 'UTC',
      };
      const existingUser = createMockUserOutput({
        email: signupData.email,
      });

      jest.spyOn(usersQueryRepository, 'getByEmail').mockResolvedValue(existingUser);

      // Act & Assert
      await expect(controller.signup(signupData)).rejects.toThrow(DomainException);
      await expect(controller.signup(signupData)).rejects.toThrow(
        'User with this email already exists',
      );
      await expect(controller.signup(signupData)).rejects.toMatchObject({
        code: DomainExceptionCode.BadRequest,
      });

      expect(usersQueryRepository.getByEmail).toHaveBeenCalledWith(signupData.email);
      expect(usersService.create).not.toHaveBeenCalled();
      expect(usersQueryRepository.getByIdOrNotFoundFail).not.toHaveBeenCalled();
    });

    it('should pass dailyKcalGoal as 0 to user creation', async () => {
      // Arrange
      const signupData: SignupInputModel = {
        email: 'test@example.com',
        password: 'Password123!',
      };
      const createdUserId = '507f1f77bcf86cd799439014';
      const mockUser = createMockUserOutput({ id: createdUserId });

      jest.spyOn(usersQueryRepository, 'getByEmail').mockResolvedValue(null);
      jest.spyOn(usersService, 'create').mockResolvedValue(createdUserId);
      jest.spyOn(usersQueryRepository, 'getByIdOrNotFoundFail').mockResolvedValue(mockUser);

      // Act
      await controller.signup(signupData);

      // Assert
      expect(usersService.create).toHaveBeenCalledWith(
        signupData.email,
        signupData.password,
        undefined,
        undefined,
        0, // dailyKcalGoal should be 0
      );
    });

    it('should return temporary token in response', async () => {
      // Arrange
      const signupData: SignupInputModel = {
        email: 'test@example.com',
        password: 'Password123!',
      };
      const createdUserId = '507f1f77bcf86cd799439015';
      const mockUser = createMockUserOutput({ id: createdUserId });

      jest.spyOn(usersQueryRepository, 'getByEmail').mockResolvedValue(null);
      jest.spyOn(usersService, 'create').mockResolvedValue(createdUserId);
      jest.spyOn(usersQueryRepository, 'getByIdOrNotFoundFail').mockResolvedValue(mockUser);

      // Act
      const result = await controller.signup(signupData);

      // Assert
      expect(result.token).toBe('temporary-token');
    });

    it('should handle different email formats', async () => {
      // Arrange
      const testEmails = [
        'user@example.com',
        'test.user@example.co.uk',
        'user+tag@example.com',
        'user123@subdomain.example.com',
      ];

      for (const email of testEmails) {
        const signupData: SignupInputModel = {
          email,
          password: 'Password123!',
        };
        const createdUserId = '507f1f77bcf86cd799439016';
        const mockUser = createMockUserOutput({ id: createdUserId, email });

        jest.spyOn(usersQueryRepository, 'getByEmail').mockResolvedValue(null);
        jest.spyOn(usersService, 'create').mockResolvedValue(createdUserId);
        jest.spyOn(usersQueryRepository, 'getByIdOrNotFoundFail').mockResolvedValue(mockUser);

        // Act
        const result = await controller.signup(signupData);

        // Assert
        expect(result.user.email).toBe(email);
        expect(usersQueryRepository.getByEmail).toHaveBeenCalledWith(email);

        jest.clearAllMocks();
      }
    });

    it('should verify password is passed correctly to service', async () => {
      // Arrange
      const signupData: SignupInputModel = {
        email: 'test@example.com',
        password: 'VerySecurePassword!456',
        displayName: 'Test User',
      };
      const createdUserId = '507f1f77bcf86cd799439017';
      const mockUser = createMockUserOutput({ id: createdUserId });

      jest.spyOn(usersQueryRepository, 'getByEmail').mockResolvedValue(null);
      jest.spyOn(usersService, 'create').mockResolvedValue(createdUserId);
      jest.spyOn(usersQueryRepository, 'getByIdOrNotFoundFail').mockResolvedValue(mockUser);

      // Act
      await controller.signup(signupData);

      // Assert
      expect(usersService.create).toHaveBeenCalledWith(
        'test@example.com',
        'VerySecurePassword!456',
        'Test User',
        undefined,
        0,
      );
    });

    it('should handle partial optional fields', async () => {
      // Arrange - only displayName provided
      const signupData: SignupInputModel = {
        email: 'partial@example.com',
        password: 'Password123!',
        displayName: 'Partial User',
        // timezone not provided
      };
      const createdUserId = '507f1f77bcf86cd799439018';
      const mockUser = createMockUserOutput({
        id: createdUserId,
        email: signupData.email,
        displayName: signupData.displayName,
        timezone: undefined,
      });

      jest.spyOn(usersQueryRepository, 'getByEmail').mockResolvedValue(null);
      jest.spyOn(usersService, 'create').mockResolvedValue(createdUserId);
      jest.spyOn(usersQueryRepository, 'getByIdOrNotFoundFail').mockResolvedValue(mockUser);

      // Act
      const result = await controller.signup(signupData);

      // Assert
      expect(result.user.displayName).toBe('Partial User');
      expect(result.user.timezone).toBeUndefined();
      expect(usersService.create).toHaveBeenCalledWith(
        signupData.email,
        signupData.password,
        signupData.displayName,
        undefined,
        0,
      );
    });

    it('should throw DomainException when user creation fails', async () => {
      // Arrange
      const signupData: SignupInputModel = {
        email: 'test@example.com',
        password: 'Password123!',
      };
      const createdUserId = '507f1f77bcf86cd799439019';
      const notFoundException = new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'user not found',
      });

      jest.spyOn(usersQueryRepository, 'getByEmail').mockResolvedValue(null);
      jest.spyOn(usersService, 'create').mockResolvedValue(createdUserId);
      jest
        .spyOn(usersQueryRepository, 'getByIdOrNotFoundFail')
        .mockRejectedValue(notFoundException);

      // Act & Assert
      await expect(controller.signup(signupData)).rejects.toThrow(DomainException);
      await expect(controller.signup(signupData)).rejects.toThrow('user not found');

      expect(usersQueryRepository.getByEmail).toHaveBeenCalled();
      expect(usersService.create).toHaveBeenCalled();
      expect(usersQueryRepository.getByIdOrNotFoundFail).toHaveBeenCalledWith(createdUserId);
    });

    it('should check for existing user before attempting creation', async () => {
      // Arrange
      const signupData: SignupInputModel = {
        email: 'test@example.com',
        password: 'Password123!',
      };
      const existingUser = createMockUserOutput({
        email: signupData.email,
      });

      jest.spyOn(usersQueryRepository, 'getByEmail').mockResolvedValue(existingUser);
      const createSpy = jest.spyOn(usersService, 'create');

      // Act & Assert
      await expect(controller.signup(signupData)).rejects.toThrow(DomainException);

      // Verify that create was never called since user already exists
      expect(createSpy).not.toHaveBeenCalled();
      expect(usersQueryRepository.getByEmail).toHaveBeenCalled();
    });

    it('should handle different timezone values', async () => {
      // Arrange
      const timezones = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'];

      for (const timezone of timezones) {
        const signupData: SignupInputModel = {
          email: `user-${timezone}@example.com`,
          password: 'Password123!',
          timezone,
        };
        const createdUserId = '507f1f77bcf86cd799439020';
        const mockUser = createMockUserOutput({
          id: createdUserId,
          timezone,
        });

        jest.spyOn(usersQueryRepository, 'getByEmail').mockResolvedValue(null);
        jest.spyOn(usersService, 'create').mockResolvedValue(createdUserId);
        jest.spyOn(usersQueryRepository, 'getByIdOrNotFoundFail').mockResolvedValue(mockUser);

        // Act
        const result = await controller.signup(signupData);

        // Assert
        expect(result.user.timezone).toBe(timezone);
        expect(usersService.create).toHaveBeenCalledWith(
          signupData.email,
          signupData.password,
          undefined,
          timezone,
          0,
        );

        jest.clearAllMocks();
      }
    });
  });
});
