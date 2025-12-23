/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService, GoogleTokenPayload } from '../application/auth.service';
import { UsersService } from '../../user-accounts/application/users.service';
import { UsersQueryRepository } from '../../user-accounts/infrastructure/users.query-repository';
import { SignupInputModel } from './models/input/signup.input.model';
import { LoginInputModel } from './models/input/login.input.model';
import { GoogleAuthInputModel } from './models/input/google-auth.input.model';
import { AuthOutputModel } from './models/output/auth.output.model';
import { UserOutputModel } from '../../user-accounts/api/models/output/user.output.model';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';
import { CurrentUserType } from './types/request-with-user.type';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let usersService: UsersService;
  let usersQueryRepository: UsersQueryRepository;

  // Mock data factory for local auth users
  const createMockUserOutput = (overrides?: Partial<UserOutputModel>): UserOutputModel => {
    return {
      id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      displayName: 'Test User',
      authProvider: 'local',
      timezone: 'UTC',
      dailyKcalGoal: 2000,
      createdAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
      ...overrides,
    };
  };

  // Mock data factory for Google auth users
  const createMockGoogleUser = (overrides?: Partial<UserOutputModel>): UserOutputModel => {
    return {
      id: '507f1f77bcf86cd799439012',
      email: 'googleuser@example.com',
      displayName: 'Google User',
      authProvider: 'google',
      googleId: 'google-id-12345',
      timezone: 'UTC',
      dailyKcalGoal: 0,
      createdAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
      ...overrides,
    };
  };

  // Mock Google token payload
  const createMockGooglePayload = (overrides?: Partial<GoogleTokenPayload>): GoogleTokenPayload => {
    return {
      email: 'googleuser@example.com',
      name: 'Google User',
      googleId: 'google-id-12345',
      picture: 'https://example.com/avatar.jpg',
      ...overrides,
    };
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            generateAccessToken: jest.fn(),
            comparePasswords: jest.fn(),
            verifyGoogleToken: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            createFromGoogle: jest.fn(),
          },
        },
        {
          provide: UsersQueryRepository,
          useValue: {
            getByEmail: jest.fn(),
            getByEmailWithPassword: jest.fn(),
            getByIdOrNotFoundFail: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
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
      const timezone = 'Europe/London';
      const signupData: SignupInputModel = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        displayName: 'New User',
        timezone,
      };
      const createdUserId = '507f1f77bcf86cd799439012';
      const mockUser = createMockUserOutput({
        id: createdUserId,
        email: signupData.email,
        displayName: signupData.displayName,
        timezone: timezone,
      });

      jest.spyOn(usersQueryRepository, 'getByEmail').mockResolvedValue(null);
      jest.spyOn(usersService, 'create').mockResolvedValue(createdUserId);
      jest.spyOn(usersQueryRepository, 'getByIdOrNotFoundFail').mockResolvedValue(mockUser);
      jest.spyOn(authService, 'generateAccessToken').mockResolvedValue('mock-jwt-token');

      // Act
      const result: AuthOutputModel = await controller.signup(signupData);

      // Assert
      expect(result).toBeDefined();
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user).toEqual(mockUser);
      expect(result.user.email).toBe(signupData.email);
      expect(result.user.displayName).toBe(signupData.displayName);
      expect(result.user.timezone).toBe(timezone);

      expect(usersQueryRepository.getByEmail).toHaveBeenCalledTimes(1);
      expect(usersQueryRepository.getByEmail).toHaveBeenCalledWith(signupData.email);
      expect(usersService.create).toHaveBeenCalledTimes(1);
      expect(usersService.create).toHaveBeenCalledWith(
        signupData.email,
        signupData.password,
        signupData.displayName,
        timezone,
        0,
      );
      expect(usersQueryRepository.getByIdOrNotFoundFail).toHaveBeenCalledTimes(1);
      expect(usersQueryRepository.getByIdOrNotFoundFail).toHaveBeenCalledWith(createdUserId);
    });

    it('should successfully register a new user with only required fields', async () => {
      // Arrange
      const timezone = 'UTC';
      const signupData: SignupInputModel = {
        email: 'minimal@example.com',
        password: 'Password123!',
        timezone,
      };
      const createdUserId = '507f1f77bcf86cd799439013';
      const mockUser = createMockUserOutput({
        id: createdUserId,
        email: signupData.email,
        displayName: undefined,
        timezone: timezone,
      });

      jest.spyOn(usersQueryRepository, 'getByEmail').mockResolvedValue(null);
      jest.spyOn(usersService, 'create').mockResolvedValue(createdUserId);
      jest.spyOn(usersQueryRepository, 'getByIdOrNotFoundFail').mockResolvedValue(mockUser);
      jest.spyOn(authService, 'generateAccessToken').mockResolvedValue('mock-jwt-token');

      // Act
      const result: AuthOutputModel = await controller.signup(signupData);

      // Assert
      expect(result).toBeDefined();
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.email).toBe(signupData.email);
      expect(result.user.displayName).toBeUndefined();
      expect(result.user.timezone).toBe(timezone);

      expect(usersService.create).toHaveBeenCalledWith(
        signupData.email,
        signupData.password,
        undefined,
        timezone,
        0,
      );
    });

    it('should throw DomainException with BadRequest when email already exists', async () => {
      // Arrange
      const timezone = 'UTC';
      const signupData: SignupInputModel = {
        email: 'existing@example.com',
        password: 'Password123!',
        displayName: 'Existing User',
        timezone,
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
      const timezone = 'UTC';
      const signupData: SignupInputModel = {
        email: 'test@example.com',
        password: 'Password123!',
        timezone,
      };
      const createdUserId = '507f1f77bcf86cd799439014';
      const mockUser = createMockUserOutput({ id: createdUserId });

      jest.spyOn(usersQueryRepository, 'getByEmail').mockResolvedValue(null);
      jest.spyOn(usersService, 'create').mockResolvedValue(createdUserId);
      jest.spyOn(usersQueryRepository, 'getByIdOrNotFoundFail').mockResolvedValue(mockUser);
      jest.spyOn(authService, 'generateAccessToken').mockResolvedValue('mock-jwt-token');

      // Act
      await controller.signup(signupData);

      // Assert
      expect(usersService.create).toHaveBeenCalledWith(
        signupData.email,
        signupData.password,
        undefined,
        timezone,
        0, // dailyKcalGoal should be 0
      );
    });

    it('should handle different timezone values from request body', async () => {
      // Arrange
      const timezone = 'America/New_York';
      const signupData: SignupInputModel = {
        email: 'test@example.com',
        password: 'Password123!',
        timezone,
      };
      const createdUserId = '507f1f77bcf86cd799439015';
      const mockUser = createMockUserOutput({
        id: createdUserId,
        timezone,
      });

      jest.spyOn(usersQueryRepository, 'getByEmail').mockResolvedValue(null);
      jest.spyOn(usersService, 'create').mockResolvedValue(createdUserId);
      jest.spyOn(usersQueryRepository, 'getByIdOrNotFoundFail').mockResolvedValue(mockUser);
      jest.spyOn(authService, 'generateAccessToken').mockResolvedValue('mock-jwt-token');

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
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      const loginData: LoginInputModel = {
        email: 'user@example.com',
        password: 'Password123!',
      };
      const mockUserWithPassword = {
        id: '507f1f77bcf86cd799439011',
        email: loginData.email,
        passwordHash: '$2b$10$hashedPassword',
        displayName: 'Test User',
        timezone: 'UTC',
        dailyKcalGoal: 2000,
        authProvider: 'local' as const,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      };
      const mockUser = createMockUserOutput({
        id: mockUserWithPassword.id,
        email: loginData.email,
      });

      jest
        .spyOn(usersQueryRepository, 'getByEmailWithPassword')
        .mockResolvedValue(mockUserWithPassword);
      jest.spyOn(usersQueryRepository, 'getByIdOrNotFoundFail').mockResolvedValue(mockUser);
      jest.spyOn(authService, 'comparePasswords').mockResolvedValue(true);
      jest.spyOn(authService, 'generateAccessToken').mockResolvedValue('mock-jwt-token');

      // Act
      const result: AuthOutputModel = await controller.login(loginData);

      // Assert
      expect(result).toBeDefined();
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user).toEqual(mockUser);
      expect(usersQueryRepository.getByEmailWithPassword).toHaveBeenCalledWith(loginData.email);
      expect(authService.comparePasswords).toHaveBeenCalledWith(
        loginData.password,
        mockUserWithPassword.passwordHash,
      );
      expect(authService.generateAccessToken).toHaveBeenCalledWith(mockUser.id, mockUser.email);
    });

    it('should throw DomainException with Unauthorized when user not found', async () => {
      // Arrange
      const loginData: LoginInputModel = {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      };

      jest.spyOn(usersQueryRepository, 'getByEmailWithPassword').mockResolvedValue(null);

      // Act & Assert
      await expect(controller.login(loginData)).rejects.toThrow(DomainException);
      await expect(controller.login(loginData)).rejects.toThrow('Invalid email or password');
      await expect(controller.login(loginData)).rejects.toMatchObject({
        code: DomainExceptionCode.Unauthorized,
      });

      expect(usersQueryRepository.getByEmailWithPassword).toHaveBeenCalledWith(loginData.email);
      expect(authService.comparePasswords).not.toHaveBeenCalled();
      expect(authService.generateAccessToken).not.toHaveBeenCalled();
    });

    it('should throw DomainException with Unauthorized when password is invalid', async () => {
      // Arrange
      const loginData: LoginInputModel = {
        email: 'user@example.com',
        password: 'WrongPassword',
      };
      const mockUserWithPassword = {
        id: '507f1f77bcf86cd799439011',
        email: loginData.email,
        passwordHash: '$2b$10$hashedPassword',
        displayName: 'Test User',
        timezone: 'UTC',
        dailyKcalGoal: 2000,
        authProvider: 'local' as const,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      };

      jest
        .spyOn(usersQueryRepository, 'getByEmailWithPassword')
        .mockResolvedValue(mockUserWithPassword);
      jest.spyOn(authService, 'comparePasswords').mockResolvedValue(false);

      // Act & Assert
      await expect(controller.login(loginData)).rejects.toThrow(DomainException);
      await expect(controller.login(loginData)).rejects.toThrow('Invalid email or password');
      await expect(controller.login(loginData)).rejects.toMatchObject({
        code: DomainExceptionCode.Unauthorized,
      });

      expect(usersQueryRepository.getByEmailWithPassword).toHaveBeenCalledWith(loginData.email);
      expect(authService.comparePasswords).toHaveBeenCalledWith(
        loginData.password,
        mockUserWithPassword.passwordHash,
      );
      expect(authService.generateAccessToken).not.toHaveBeenCalled();
    });

    it('should handle user with null passwordHash', async () => {
      // Arrange
      const loginData: LoginInputModel = {
        email: 'user@example.com',
        password: 'Password123!',
      };
      const mockUserWithPassword = {
        id: '507f1f77bcf86cd799439011',
        email: loginData.email,
        passwordHash: undefined,
        displayName: 'Test User',
        timezone: 'UTC',
        dailyKcalGoal: 2000,
        authProvider: 'local' as const,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      };

      jest
        .spyOn(usersQueryRepository, 'getByEmailWithPassword')
        .mockResolvedValue(mockUserWithPassword);
      jest.spyOn(authService, 'comparePasswords').mockResolvedValue(false);

      // Act & Assert
      await expect(controller.login(loginData)).rejects.toThrow(DomainException);

      expect(authService.comparePasswords).toHaveBeenCalledWith(loginData.password, '');
    });

    it('should generate JWT token on successful login', async () => {
      // Arrange
      const loginData: LoginInputModel = {
        email: 'user@example.com',
        password: 'Password123!',
      };
      const mockUserWithPassword = {
        id: 'user-id-123',
        email: loginData.email,
        passwordHash: '$2b$10$hashedPassword',
        displayName: 'Test User',
        timezone: 'UTC',
        dailyKcalGoal: 2000,
        authProvider: 'local' as const,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      };
      const mockUser = createMockUserOutput({
        id: 'user-id-123',
        email: loginData.email,
      });

      jest
        .spyOn(usersQueryRepository, 'getByEmailWithPassword')
        .mockResolvedValue(mockUserWithPassword);
      jest.spyOn(usersQueryRepository, 'getByIdOrNotFoundFail').mockResolvedValue(mockUser);
      jest.spyOn(authService, 'comparePasswords').mockResolvedValue(true);
      jest.spyOn(authService, 'generateAccessToken').mockResolvedValue('generated-token-abc');

      // Act
      const result = await controller.login(loginData);

      // Assert
      expect(result.token).toBe('generated-token-abc');
      expect(authService.generateAccessToken).toHaveBeenCalledWith('user-id-123', loginData.email);
    });
  });

  describe('googleAuth', () => {
    it('should successfully authenticate new user with Google token', async () => {
      // Arrange
      const timezone = 'Europe/Moscow';
      const googleAuthData: GoogleAuthInputModel = {
        idToken: 'valid-google-id-token',
        timezone,
      };
      const googlePayload = createMockGooglePayload();
      const createdUserId = '507f1f77bcf86cd799439020';
      const mockUser = createMockGoogleUser({
        id: createdUserId,
        email: googlePayload.email,
        displayName: googlePayload.name,
        googleId: googlePayload.googleId,
        timezone: timezone,
      });

      jest.spyOn(authService, 'verifyGoogleToken').mockResolvedValue(googlePayload);
      jest.spyOn(usersQueryRepository, 'getByEmail').mockResolvedValue(null);
      jest.spyOn(usersService, 'createFromGoogle').mockResolvedValue(createdUserId);
      jest.spyOn(usersQueryRepository, 'getByIdOrNotFoundFail').mockResolvedValue(mockUser);
      jest.spyOn(authService, 'generateAccessToken').mockResolvedValue('mock-jwt-token');

      // Act
      const result: AuthOutputModel = await controller.googleAuth(googleAuthData);

      // Assert
      expect(result).toBeDefined();
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user).toEqual(mockUser);
      expect(result.user.authProvider).toBe('google');
      expect(result.user.googleId).toBe(googlePayload.googleId);

      expect(authService.verifyGoogleToken).toHaveBeenCalledWith(googleAuthData.idToken);
      expect(usersQueryRepository.getByEmail).toHaveBeenCalledWith(googlePayload.email);
      expect(usersService.createFromGoogle).toHaveBeenCalledWith(
        googlePayload.email,
        googlePayload.googleId,
        googlePayload.name,
        timezone,
      );
      expect(usersQueryRepository.getByIdOrNotFoundFail).toHaveBeenCalledWith(createdUserId);
      expect(authService.generateAccessToken).toHaveBeenCalledWith(mockUser.id, mockUser.email);
    });

    it('should successfully authenticate existing Google user', async () => {
      // Arrange
      const timezone = 'UTC';
      const googleAuthData: GoogleAuthInputModel = {
        idToken: 'valid-google-id-token',
        timezone,
      };
      const googlePayload = createMockGooglePayload();
      const existingUser = createMockGoogleUser({
        email: googlePayload.email,
        googleId: googlePayload.googleId,
      });

      jest.spyOn(authService, 'verifyGoogleToken').mockResolvedValue(googlePayload);
      jest.spyOn(usersQueryRepository, 'getByEmail').mockResolvedValue(existingUser);
      jest.spyOn(authService, 'generateAccessToken').mockResolvedValue('mock-jwt-token');

      // Act
      const result: AuthOutputModel = await controller.googleAuth(googleAuthData);

      // Assert
      expect(result).toBeDefined();
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user).toEqual(existingUser);

      expect(authService.verifyGoogleToken).toHaveBeenCalledWith(googleAuthData.idToken);
      expect(usersQueryRepository.getByEmail).toHaveBeenCalledWith(googlePayload.email);
      expect(usersService.createFromGoogle).not.toHaveBeenCalled();
      expect(authService.generateAccessToken).toHaveBeenCalledWith(
        existingUser.id,
        existingUser.email,
      );
    });

    it('should throw DomainException when Google token verification fails', async () => {
      // Arrange
      const timezone = 'UTC';
      const googleAuthData: GoogleAuthInputModel = {
        idToken: 'invalid-google-token',
        timezone,
      };
      const verifyError = new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Failed to verify Google token',
      });

      jest.spyOn(authService, 'verifyGoogleToken').mockRejectedValue(verifyError);

      // Act & Assert
      await expect(controller.googleAuth(googleAuthData)).rejects.toThrow(DomainException);
      await expect(controller.googleAuth(googleAuthData)).rejects.toMatchObject({
        code: DomainExceptionCode.Unauthorized,
        message: 'Failed to verify Google token',
      });

      expect(authService.verifyGoogleToken).toHaveBeenCalledWith(googleAuthData.idToken);
      expect(usersQueryRepository.getByEmail).not.toHaveBeenCalled();
      expect(usersService.createFromGoogle).not.toHaveBeenCalled();
    });

    it('should throw DomainException when trying to link Google to existing local account', async () => {
      // Arrange
      const timezone = 'UTC';
      const googleAuthData: GoogleAuthInputModel = {
        idToken: 'valid-google-id-token',
        timezone,
      };
      const googlePayload = createMockGooglePayload({
        email: 'localuser@example.com',
      });
      const existingLocalUser = createMockUserOutput({
        email: googlePayload.email,
        authProvider: 'local',
        googleId: undefined,
        timezone,
      });

      jest.spyOn(authService, 'verifyGoogleToken').mockResolvedValue(googlePayload);
      jest.spyOn(usersQueryRepository, 'getByEmail').mockResolvedValue(existingLocalUser);

      // Act & Assert
      await expect(controller.googleAuth(googleAuthData)).rejects.toThrow(DomainException);
      await expect(controller.googleAuth(googleAuthData)).rejects.toThrow(
        'An account with this email already exists. Please login with email and password.',
      );
      await expect(controller.googleAuth(googleAuthData)).rejects.toMatchObject({
        code: DomainExceptionCode.BadRequest,
      });

      expect(authService.verifyGoogleToken).toHaveBeenCalledWith(googleAuthData.idToken);
      expect(usersQueryRepository.getByEmail).toHaveBeenCalledWith(googlePayload.email);
      expect(usersService.createFromGoogle).not.toHaveBeenCalled();
    });

    it('should create new user with timezone from request body', async () => {
      // Arrange
      const timezone = 'Asia/Tokyo';
      const googleAuthData: GoogleAuthInputModel = {
        idToken: 'valid-google-id-token',
        timezone,
      };
      const googlePayload = createMockGooglePayload();
      const createdUserId = '507f1f77bcf86cd799439021';
      const mockUser = createMockGoogleUser({
        id: createdUserId,
        timezone: timezone,
      });

      jest.spyOn(authService, 'verifyGoogleToken').mockResolvedValue(googlePayload);
      jest.spyOn(usersQueryRepository, 'getByEmail').mockResolvedValue(null);
      jest.spyOn(usersService, 'createFromGoogle').mockResolvedValue(createdUserId);
      jest.spyOn(usersQueryRepository, 'getByIdOrNotFoundFail').mockResolvedValue(mockUser);
      jest.spyOn(authService, 'generateAccessToken').mockResolvedValue('mock-jwt-token');

      // Act
      await controller.googleAuth(googleAuthData);

      // Assert
      expect(usersService.createFromGoogle).toHaveBeenCalledWith(
        googlePayload.email,
        googlePayload.googleId,
        googlePayload.name,
        timezone,
      );
    });

    it('should handle Google payload without optional name field', async () => {
      // Arrange
      const timezone = 'UTC';
      const googleAuthData: GoogleAuthInputModel = {
        idToken: 'valid-google-id-token',
        timezone,
      };
      const googlePayload = createMockGooglePayload({
        name: undefined,
      });
      const createdUserId = '507f1f77bcf86cd799439022';
      const mockUser = createMockGoogleUser({
        id: createdUserId,
        displayName: undefined,
      });

      jest.spyOn(authService, 'verifyGoogleToken').mockResolvedValue(googlePayload);
      jest.spyOn(usersQueryRepository, 'getByEmail').mockResolvedValue(null);
      jest.spyOn(usersService, 'createFromGoogle').mockResolvedValue(createdUserId);
      jest.spyOn(usersQueryRepository, 'getByIdOrNotFoundFail').mockResolvedValue(mockUser);
      jest.spyOn(authService, 'generateAccessToken').mockResolvedValue('mock-jwt-token');

      // Act
      await controller.googleAuth(googleAuthData);

      // Assert
      expect(usersService.createFromGoogle).toHaveBeenCalledWith(
        googlePayload.email,
        googlePayload.googleId,
        undefined,
        timezone,
      );
    });

    it('should throw DomainException when user creation fails during Google auth', async () => {
      // Arrange
      const timezone = 'UTC';
      const googleAuthData: GoogleAuthInputModel = {
        idToken: 'valid-google-id-token',
        timezone,
      };
      const googlePayload = createMockGooglePayload();
      const createdUserId = '507f1f77bcf86cd799439023';
      const notFoundException = new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'user not found',
      });

      jest.spyOn(authService, 'verifyGoogleToken').mockResolvedValue(googlePayload);
      jest.spyOn(usersQueryRepository, 'getByEmail').mockResolvedValue(null);
      jest.spyOn(usersService, 'createFromGoogle').mockResolvedValue(createdUserId);
      jest
        .spyOn(usersQueryRepository, 'getByIdOrNotFoundFail')
        .mockRejectedValue(notFoundException);

      // Act & Assert
      await expect(controller.googleAuth(googleAuthData)).rejects.toThrow(DomainException);
      await expect(controller.googleAuth(googleAuthData)).rejects.toThrow('user not found');

      expect(authService.verifyGoogleToken).toHaveBeenCalled();
      expect(usersService.createFromGoogle).toHaveBeenCalled();
      expect(usersQueryRepository.getByIdOrNotFoundFail).toHaveBeenCalledWith(createdUserId);
    });

    it('should generate JWT token for Google authenticated user', async () => {
      // Arrange
      const timezone = 'UTC';
      const googleAuthData: GoogleAuthInputModel = {
        idToken: 'valid-google-id-token',
        timezone,
      };
      const googlePayload = createMockGooglePayload();
      const existingUser = createMockGoogleUser({
        id: 'google-user-id-123',
        email: googlePayload.email,
      });

      jest.spyOn(authService, 'verifyGoogleToken').mockResolvedValue(googlePayload);
      jest.spyOn(usersQueryRepository, 'getByEmail').mockResolvedValue(existingUser);
      jest.spyOn(authService, 'generateAccessToken').mockResolvedValue('google-jwt-token-xyz');

      // Act
      const result = await controller.googleAuth(googleAuthData);

      // Assert
      expect(result.token).toBe('google-jwt-token-xyz');
      expect(authService.generateAccessToken).toHaveBeenCalledWith(
        'google-user-id-123',
        googlePayload.email,
      );
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user data for authenticated user', async () => {
      // Arrange
      const currentUser: CurrentUserType = {
        userId: '507f1f77bcf86cd799439030',
        email: 'authenticated@example.com',
      };
      const mockUser = createMockUserOutput({
        id: currentUser.userId,
        email: currentUser.email,
      });

      jest.spyOn(usersQueryRepository, 'getByIdOrNotFoundFail').mockResolvedValue(mockUser);

      // Act
      const result = await controller.getCurrentUser(currentUser);

      // Assert
      expect(result).toEqual(mockUser);
      expect(usersQueryRepository.getByIdOrNotFoundFail).toHaveBeenCalledWith(currentUser.userId);
    });

    it('should throw DomainException when user not found', async () => {
      // Arrange
      const currentUser: CurrentUserType = {
        userId: 'nonexistent-user-id',
        email: 'nonexistent@example.com',
      };
      const notFoundException = new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'user not found',
      });

      jest
        .spyOn(usersQueryRepository, 'getByIdOrNotFoundFail')
        .mockRejectedValue(notFoundException);

      // Act & Assert
      await expect(controller.getCurrentUser(currentUser)).rejects.toThrow(DomainException);
      await expect(controller.getCurrentUser(currentUser)).rejects.toThrow('user not found');
      await expect(controller.getCurrentUser(currentUser)).rejects.toMatchObject({
        code: DomainExceptionCode.NotFound,
      });

      expect(usersQueryRepository.getByIdOrNotFoundFail).toHaveBeenCalledWith(currentUser.userId);
    });

    it('should return Google user data for authenticated Google user', async () => {
      // Arrange
      const currentUser: CurrentUserType = {
        userId: '507f1f77bcf86cd799439031',
        email: 'googleuser@example.com',
      };
      const mockGoogleUser = createMockGoogleUser({
        id: currentUser.userId,
        email: currentUser.email,
      });

      jest.spyOn(usersQueryRepository, 'getByIdOrNotFoundFail').mockResolvedValue(mockGoogleUser);

      // Act
      const result = await controller.getCurrentUser(currentUser);

      // Assert
      expect(result).toEqual(mockGoogleUser);
      expect(result.authProvider).toBe('google');
      expect(result.googleId).toBeDefined();
      expect(usersQueryRepository.getByIdOrNotFoundFail).toHaveBeenCalledWith(currentUser.userId);
    });
  });
});
