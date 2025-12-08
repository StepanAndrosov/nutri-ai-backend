/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from '../application/users.service';
import { UsersQueryRepository } from '../infrastructure/users.query-repository';
import { UserCreateModel } from './models/input/create-user.input.model';
import { UserOutputModel } from './models/output/user.output.model';
import { PaginationOutput } from '../../../base/models/pagination.base.model';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';
import { ParsedQs } from 'qs';

describe('UsersController', () => {
  let controller: UsersController;
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
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: UsersQueryRepository,
          useValue: {
            getAll: jest.fn(),
            getByIdOrNotFoundFail: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
    usersQueryRepository = module.get<UsersQueryRepository>(UsersQueryRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAll', () => {
    it('should return paginated list of users with default pagination', async () => {
      // Arrange
      const mockUsers = [
        createMockUserOutput({ id: '1', email: 'user1@example.com' }),
        createMockUserOutput({ id: '2', email: 'user2@example.com' }),
      ];
      const mockPaginationOutput = new PaginationOutput<UserOutputModel>(mockUsers, 1, 10, 2);
      const query: ParsedQs = {};

      jest.spyOn(usersQueryRepository, 'getAll').mockResolvedValue(mockPaginationOutput);

      // Act
      const result = await controller.getAll(query);

      // Assert
      expect(result).toEqual(mockPaginationOutput);
      expect(result.items).toHaveLength(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.totalCount).toBe(2);
      expect(result.pagesCount).toBe(1);
      expect(usersQueryRepository.getAll).toHaveBeenCalledTimes(1);
      expect(usersQueryRepository.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
          pageNumber: 1,
          pageSize: 10,
          sortDirection: 'desc',
          sortBy: 'createdAt',
          searchEmailTerm: null,
        }),
      );
    });

    it('should return paginated list with custom pagination parameters', async () => {
      // Arrange
      const mockUsers = [createMockUserOutput()];
      const mockPaginationOutput = new PaginationOutput<UserOutputModel>(mockUsers, 2, 5, 12);
      const query: ParsedQs = {
        pageNumber: '2',
        pageSize: '5',
        sortBy: 'email',
        sortDirection: 'asc',
      };

      jest.spyOn(usersQueryRepository, 'getAll').mockResolvedValue(mockPaginationOutput);

      // Act
      const result = await controller.getAll(query);

      // Assert
      expect(result).toEqual(mockPaginationOutput);
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(5);
      expect(result.pagesCount).toBe(3); // Math.ceil(12/5)
      expect(usersQueryRepository.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
          pageNumber: 2,
          pageSize: 5,
          sortBy: 'email',
          sortDirection: 'asc',
        }),
      );
    });

    it('should filter users by email search term', async () => {
      // Arrange
      const mockUsers = [createMockUserOutput({ email: 'test@example.com' })];
      const mockPaginationOutput = new PaginationOutput<UserOutputModel>(mockUsers, 1, 10, 1);
      const query: ParsedQs = {
        searchEmailTerm: 'test',
      };

      jest.spyOn(usersQueryRepository, 'getAll').mockResolvedValue(mockPaginationOutput);

      // Act
      const result = await controller.getAll(query);

      // Assert
      expect(result.items).toHaveLength(1);
      expect(result.items[0].email).toContain('test');
      expect(usersQueryRepository.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
          searchEmailTerm: 'test',
        }),
      );
    });

    it('should return empty items array when no users match criteria', async () => {
      // Arrange
      const mockPaginationOutput = new PaginationOutput<UserOutputModel>([], 1, 10, 0);
      const query: ParsedQs = {
        searchEmailTerm: 'nonexistent',
      };

      jest.spyOn(usersQueryRepository, 'getAll').mockResolvedValue(mockPaginationOutput);

      // Act
      const result = await controller.getAll(query);

      // Assert
      expect(result.items).toEqual([]);
      expect(result.totalCount).toBe(0);
      expect(result.pagesCount).toBe(0);
    });

    it('should sort by displayName when specified', async () => {
      // Arrange
      const mockUsers = [
        createMockUserOutput({ displayName: 'Alice' }),
        createMockUserOutput({ displayName: 'Bob' }),
      ];
      const mockPaginationOutput = new PaginationOutput<UserOutputModel>(mockUsers, 1, 10, 2);
      const query: ParsedQs = {
        sortBy: 'displayName',
        sortDirection: 'asc',
      };

      jest.spyOn(usersQueryRepository, 'getAll').mockResolvedValue(mockPaginationOutput);

      // Act
      await controller.getAll(query);

      // Assert
      expect(usersQueryRepository.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'displayName',
          sortDirection: 'asc',
        }),
      );
    });
  });

  describe('getById', () => {
    it('should return user by id when user exists', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const mockUser = createMockUserOutput({ id: userId });

      jest.spyOn(usersQueryRepository, 'getByIdOrNotFoundFail').mockResolvedValue(mockUser);

      // Act
      const result = await controller.getById(userId);

      // Assert
      expect(result).toEqual(mockUser);
      expect(result).not.toBeNull();
      expect(result.id).toBe(userId);
      expect(usersQueryRepository.getByIdOrNotFoundFail).toHaveBeenCalledTimes(1);
      expect(usersQueryRepository.getByIdOrNotFoundFail).toHaveBeenCalledWith(userId);
    });

    it('should throw DomainException with NotFound code when user does not exist', async () => {
      // Arrange
      const userId = 'nonexistent-id';
      const notFoundException = new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'user not found',
      });

      jest
        .spyOn(usersQueryRepository, 'getByIdOrNotFoundFail')
        .mockRejectedValue(notFoundException);

      // Act & Assert
      await expect(controller.getById(userId)).rejects.toThrow(DomainException);
      await expect(controller.getById(userId)).rejects.toThrow('user not found');
      await expect(controller.getById(userId)).rejects.toMatchObject({
        code: DomainExceptionCode.NotFound,
      });
      expect(usersQueryRepository.getByIdOrNotFoundFail).toHaveBeenCalledWith(userId);
    });

    it('should return user with all optional fields populated', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const mockUser = createMockUserOutput({
        id: userId,
        displayName: 'John Doe',
        timezone: 'America/New_York',
        dailyKcalGoal: 2500,
      });

      jest.spyOn(usersQueryRepository, 'getByIdOrNotFoundFail').mockResolvedValue(mockUser);

      // Act
      const result = await controller.getById(userId);

      // Assert
      expect(result).not.toBeNull();
      expect(result.displayName).toBe('John Doe');
      expect(result.timezone).toBe('America/New_York');
      expect(result.dailyKcalGoal).toBe(2500);
    });

    it('should return user with minimal fields (only required)', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const mockUser = createMockUserOutput({
        id: userId,
        displayName: undefined,
        timezone: undefined,
        dailyKcalGoal: undefined,
      });

      jest.spyOn(usersQueryRepository, 'getByIdOrNotFoundFail').mockResolvedValue(mockUser);

      // Act
      const result = await controller.getById(userId);

      // Assert
      expect(result).not.toBeNull();
      expect(result.email).toBe('test@example.com');
      expect(result.passwordHash).toBeDefined();
      expect(result.displayName).toBeUndefined();
      expect(result.timezone).toBeUndefined();
      expect(result.dailyKcalGoal).toBeUndefined();
    });
  });

  describe('create', () => {
    it('should create a new user with all fields and return created user', async () => {
      // Arrange
      const createModel: UserCreateModel = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        displayName: 'New User',
        timezone: 'Europe/London',
        dailyKcalGoal: 2200,
      };
      const createdUserId = '507f1f77bcf86cd799439012';
      const mockCreatedUser = createMockUserOutput({
        id: createdUserId,
        email: createModel.email,
        displayName: createModel.displayName,
        timezone: createModel.timezone,
        dailyKcalGoal: createModel.dailyKcalGoal,
      });

      jest.spyOn(usersService, 'create').mockResolvedValue(createdUserId);
      jest.spyOn(usersQueryRepository, 'getByIdOrNotFoundFail').mockResolvedValue(mockCreatedUser);

      // Act
      const result = await controller.create(createModel);

      // Assert
      expect(result).toEqual(mockCreatedUser);
      expect(usersService.create).toHaveBeenCalledTimes(1);
      expect(usersService.create).toHaveBeenCalledWith(
        createModel.email,
        createModel.password,
        createModel.displayName,
        createModel.timezone,
        createModel.dailyKcalGoal,
      );
      expect(usersQueryRepository.getByIdOrNotFoundFail).toHaveBeenCalledWith(createdUserId);
    });

    it('should create a new user with only required fields', async () => {
      // Arrange
      const createModel: UserCreateModel = {
        email: 'minimal@example.com',
        password: 'Password123!',
      };
      const createdUserId = '507f1f77bcf86cd799439013';
      const mockCreatedUser = createMockUserOutput({
        id: createdUserId,
        email: createModel.email,
        displayName: undefined,
        timezone: undefined,
        dailyKcalGoal: undefined,
      });

      jest.spyOn(usersService, 'create').mockResolvedValue(createdUserId);
      jest.spyOn(usersQueryRepository, 'getByIdOrNotFoundFail').mockResolvedValue(mockCreatedUser);

      // Act
      const result = await controller.create(createModel);

      // Assert
      expect(result).toBeDefined();
      expect(result?.email).toBe(createModel.email);
      expect(result?.displayName).toBeUndefined();
      expect(result?.timezone).toBeUndefined();
      expect(result?.dailyKcalGoal).toBeUndefined();
      expect(usersService.create).toHaveBeenCalledWith(
        createModel.email,
        createModel.password,
        undefined,
        undefined,
        undefined,
      );
    });

    it('should create user with partial optional fields', async () => {
      // Arrange
      const createModel: UserCreateModel = {
        email: 'partial@example.com',
        password: 'Password123!',
        displayName: 'Partial User',
        // timezone and dailyKcalGoal not provided
      };
      const createdUserId = '507f1f77bcf86cd799439014';
      const mockCreatedUser = createMockUserOutput({
        id: createdUserId,
        email: createModel.email,
        displayName: createModel.displayName,
        timezone: undefined,
        dailyKcalGoal: undefined,
      });

      jest.spyOn(usersService, 'create').mockResolvedValue(createdUserId);
      jest.spyOn(usersQueryRepository, 'getByIdOrNotFoundFail').mockResolvedValue(mockCreatedUser);

      // Act
      const result = await controller.create(createModel);

      // Assert
      expect(result).toBeDefined();
      expect(result?.displayName).toBe('Partial User');
      expect(result?.timezone).toBeUndefined();
      expect(result?.dailyKcalGoal).toBeUndefined();
      expect(usersService.create).toHaveBeenCalledWith(
        createModel.email,
        createModel.password,
        createModel.displayName,
        undefined,
        undefined,
      );
    });

    it('should handle DomainException when fetching created user fails', async () => {
      // Arrange
      const createModel: UserCreateModel = {
        email: 'test@example.com',
        password: 'Password123!',
      };
      const createdUserId = '507f1f77bcf86cd799439015';
      const notFoundException = new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'user not found',
      });

      jest.spyOn(usersService, 'create').mockResolvedValue(createdUserId);
      jest
        .spyOn(usersQueryRepository, 'getByIdOrNotFoundFail')
        .mockRejectedValue(notFoundException);

      // Act & Assert
      await expect(controller.create(createModel)).rejects.toThrow(DomainException);
      expect(usersService.create).toHaveBeenCalled();
      expect(usersQueryRepository.getByIdOrNotFoundFail).toHaveBeenCalledWith(createdUserId);
    });

    it('should verify password is passed to service correctly', async () => {
      // Arrange
      const createModel: UserCreateModel = {
        email: 'test@example.com',
        password: 'VerySecurePassword!456',
        displayName: 'Test',
      };
      const createdUserId = '507f1f77bcf86cd799439016';
      const mockCreatedUser = createMockUserOutput({ id: createdUserId });

      jest.spyOn(usersService, 'create').mockResolvedValue(createdUserId);
      jest.spyOn(usersQueryRepository, 'getByIdOrNotFoundFail').mockResolvedValue(mockCreatedUser);

      // Act
      await controller.create(createModel);

      // Assert
      expect(usersService.create).toHaveBeenCalledWith(
        'test@example.com',
        'VerySecurePassword!456',
        'Test',
        undefined,
        undefined,
      );
    });

    it('should create user with dailyKcalGoal boundary value', async () => {
      // Arrange
      const createModel: UserCreateModel = {
        email: 'test@example.com',
        password: 'Password123!',
        dailyKcalGoal: 0, // minimum value
      };
      const createdUserId = '507f1f77bcf86cd799439017';
      const mockCreatedUser = createMockUserOutput({
        id: createdUserId,
        dailyKcalGoal: 0,
      });

      jest.spyOn(usersService, 'create').mockResolvedValue(createdUserId);
      jest.spyOn(usersQueryRepository, 'getByIdOrNotFoundFail').mockResolvedValue(mockCreatedUser);

      // Act
      const result = await controller.create(createModel);

      // Assert
      expect(result).toBeDefined();
      expect(result?.dailyKcalGoal).toBe(0);
      expect(usersService.create).toHaveBeenCalledWith(
        createModel.email,
        createModel.password,
        undefined,
        undefined,
        0,
      );
    });
  });

  describe('delete', () => {
    it('should delete user successfully when user exists', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      jest.spyOn(usersService, 'delete').mockResolvedValue(true);

      // Act
      const result = await controller.delete(userId);

      // Assert
      expect(result).toBeUndefined();
      expect(usersService.delete).toHaveBeenCalledTimes(1);
      expect(usersService.delete).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Arrange
      const userId = 'nonexistent-id';
      jest.spyOn(usersService, 'delete').mockResolvedValue(false);

      // Act & Assert
      await expect(controller.delete(userId)).rejects.toThrow(NotFoundException);
      await expect(controller.delete(userId)).rejects.toThrow(`User with id ${userId} not found`);
      expect(usersService.delete).toHaveBeenCalledWith(userId);
    });

    it('should call service delete method with correct id', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439018';
      jest.spyOn(usersService, 'delete').mockResolvedValue(true);

      // Act
      await controller.delete(userId);

      // Assert
      expect(usersService.delete).toHaveBeenCalledWith(userId);
    });

    it('should handle different user ids correctly', async () => {
      // Arrange
      const userIds = [
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439013',
      ];
      jest.spyOn(usersService, 'delete').mockResolvedValue(true);

      // Act & Assert
      for (const userId of userIds) {
        await controller.delete(userId);
        expect(usersService.delete).toHaveBeenCalledWith(userId);
      }

      expect(usersService.delete).toHaveBeenCalledTimes(3);
    });

    it('should return undefined (no content) on successful deletion', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      jest.spyOn(usersService, 'delete').mockResolvedValue(true);

      // Act
      const result = await controller.delete(userId);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException before returning when delete returns false', async () => {
      // Arrange
      const userId = 'invalid-id';
      jest.spyOn(usersService, 'delete').mockResolvedValue(false);

      // Act & Assert
      let errorThrown = false;
      try {
        await controller.delete(userId);
      } catch (error) {
        errorThrown = true;
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toBe(`User with id ${userId} not found`);
      }

      expect(errorThrown).toBe(true);
    });
  });
});
