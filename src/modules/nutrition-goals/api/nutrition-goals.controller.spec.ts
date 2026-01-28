/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NutritionGoalsController } from './nutrition-goals.controller';
import { NutritionGoalsService } from '../application/nutrition-goals.service';
import { NutritionGoalsOutputModel } from './models/output/nutrition-goals.output.model';
import { UpdateNutritionGoalsInputModel } from './models/input/update-nutrition-goals.input.model';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';
import { CurrentUserType } from '../../auth/api/types/request-with-user.type';

describe('NutritionGoalsController', () => {
  let controller: NutritionGoalsController;
  let service: NutritionGoalsService;

  // Mock data factory for nutrition goals
  const createMockNutritionGoals = (
    overrides?: Partial<NutritionGoalsOutputModel>,
  ): NutritionGoalsOutputModel => {
    const goals = new NutritionGoalsOutputModel();
    goals.id = '507f1f77bcf86cd799439011';
    goals.userId = '507f1f77bcf86cd799439030';
    goals.dailyKcalGoal = 2000;
    goals.proteinPct = 30;
    goals.fatPct = 30;
    goals.carbsPct = 40;
    goals.proteinGrams = 150; // (2000 * 30 / 100) / 4
    goals.fatGrams = 67; // (2000 * 30 / 100) / 9
    goals.carbsGrams = 200; // (2000 * 40 / 100) / 4
    goals.createdAt = new Date('2024-01-01T00:00:00.000Z');
    goals.updatedAt = new Date('2024-01-01T00:00:00.000Z');
    return { ...goals, ...overrides };
  };

  // Mock current user
  const createMockUser = (overrides?: Partial<CurrentUserType>): CurrentUserType => {
    return {
      userId: '507f1f77bcf86cd799439030',
      email: 'user@example.com',
      ...overrides,
    };
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NutritionGoalsController],
      providers: [
        {
          provide: NutritionGoalsService,
          useValue: {
            getOrCreateDefault: jest.fn(),
            updateGoals: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<NutritionGoalsController>(NutritionGoalsController);
    service = module.get<NutritionGoalsService>(NutritionGoalsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getGoals', () => {
    it('should successfully get existing nutrition goals for user', async () => {
      // Arrange
      const user = createMockUser();
      const mockGoals = createMockNutritionGoals({ userId: user.userId });

      jest.spyOn(service, 'getOrCreateDefault').mockResolvedValue(mockGoals);

      // Act
      const result: NutritionGoalsOutputModel = await controller.getGoals(user);

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual(mockGoals);
      expect(result.userId).toBe(user.userId);
      expect(result.dailyKcalGoal).toBe(2000);
      expect(result.proteinPct).toBe(30);
      expect(result.fatPct).toBe(30);
      expect(result.carbsPct).toBe(40);
      expect(result.proteinGrams).toBe(150);
      expect(result.fatGrams).toBe(67);
      expect(result.carbsGrams).toBe(200);
      expect(service.getOrCreateDefault).toHaveBeenCalledTimes(1);
      expect(service.getOrCreateDefault).toHaveBeenCalledWith(user.userId);
    });

    it('should create default goals when user has no existing goals', async () => {
      // Arrange
      const user = createMockUser();
      const defaultGoals = createMockNutritionGoals({
        userId: user.userId,
        dailyKcalGoal: 2000,
        proteinPct: 30,
        fatPct: 30,
        carbsPct: 40,
      });

      jest.spyOn(service, 'getOrCreateDefault').mockResolvedValue(defaultGoals);

      // Act
      const result = await controller.getGoals(user);

      // Assert
      expect(result).toBeDefined();
      expect(result.dailyKcalGoal).toBe(2000);
      expect(result.proteinPct).toBe(30);
      expect(result.fatPct).toBe(30);
      expect(result.carbsPct).toBe(40);
      expect(service.getOrCreateDefault).toHaveBeenCalledWith(user.userId);
    });

    it('should return goals with correctly calculated macros in grams', async () => {
      // Arrange
      const user = createMockUser();
      const mockGoals = createMockNutritionGoals({
        userId: user.userId,
        dailyKcalGoal: 2500,
        proteinPct: 25,
        fatPct: 35,
        carbsPct: 40,
        proteinGrams: 156, // (2500 * 25 / 100) / 4
        fatGrams: 97, // (2500 * 35 / 100) / 9
        carbsGrams: 250, // (2500 * 40 / 100) / 4
      });

      jest.spyOn(service, 'getOrCreateDefault').mockResolvedValue(mockGoals);

      // Act
      const result = await controller.getGoals(user);

      // Assert
      expect(result.proteinGrams).toBe(156);
      expect(result.fatGrams).toBe(97);
      expect(result.carbsGrams).toBe(250);
      expect(service.getOrCreateDefault).toHaveBeenCalledWith(user.userId);
    });

    it('should handle different users with different goals', async () => {
      // Arrange
      const user1 = createMockUser({ userId: 'user-id-1' });
      const user2 = createMockUser({ userId: 'user-id-2' });
      const goals1 = createMockNutritionGoals({ userId: 'user-id-1', dailyKcalGoal: 1800 });
      const goals2 = createMockNutritionGoals({ userId: 'user-id-2', dailyKcalGoal: 2200 });

      jest
        .spyOn(service, 'getOrCreateDefault')
        .mockResolvedValueOnce(goals1)
        .mockResolvedValueOnce(goals2);

      // Act
      const result1 = await controller.getGoals(user1);
      const result2 = await controller.getGoals(user2);

      // Assert
      expect(result1.userId).toBe('user-id-1');
      expect(result1.dailyKcalGoal).toBe(1800);
      expect(result2.userId).toBe('user-id-2');
      expect(result2.dailyKcalGoal).toBe(2200);
      expect(service.getOrCreateDefault).toHaveBeenCalledTimes(2);
      expect(service.getOrCreateDefault).toHaveBeenNthCalledWith(1, 'user-id-1');
      expect(service.getOrCreateDefault).toHaveBeenNthCalledWith(2, 'user-id-2');
    });

    it('should return goals with minimum valid calorie goal', async () => {
      // Arrange
      const user = createMockUser();
      const mockGoals = createMockNutritionGoals({
        userId: user.userId,
        dailyKcalGoal: 1000, // Minimum allowed
        proteinPct: 30,
        fatPct: 30,
        carbsPct: 40,
        proteinGrams: 75, // (1000 * 30 / 100) / 4
        fatGrams: 33, // (1000 * 30 / 100) / 9
        carbsGrams: 100, // (1000 * 40 / 100) / 4
      });

      jest.spyOn(service, 'getOrCreateDefault').mockResolvedValue(mockGoals);

      // Act
      const result = await controller.getGoals(user);

      // Assert
      expect(result.dailyKcalGoal).toBe(1000);
      expect(result.proteinGrams).toBe(75);
      expect(result.fatGrams).toBe(33);
      expect(result.carbsGrams).toBe(100);
    });

    it('should return goals with maximum valid calorie goal', async () => {
      // Arrange
      const user = createMockUser();
      const mockGoals = createMockNutritionGoals({
        userId: user.userId,
        dailyKcalGoal: 10000, // Maximum allowed
        proteinPct: 30,
        fatPct: 30,
        carbsPct: 40,
        proteinGrams: 750, // (10000 * 30 / 100) / 4
        fatGrams: 333, // (10000 * 30 / 100) / 9
        carbsGrams: 1000, // (10000 * 40 / 100) / 4
      });

      jest.spyOn(service, 'getOrCreateDefault').mockResolvedValue(mockGoals);

      // Act
      const result = await controller.getGoals(user);

      // Assert
      expect(result.dailyKcalGoal).toBe(10000);
      expect(result.proteinGrams).toBe(750);
      expect(result.fatGrams).toBe(333);
      expect(result.carbsGrams).toBe(1000);
    });

    it('should return goals with extreme but valid macro distribution', async () => {
      // Arrange
      const user = createMockUser();
      const mockGoals = createMockNutritionGoals({
        userId: user.userId,
        dailyKcalGoal: 2000,
        proteinPct: 80, // Maximum allowed
        fatPct: 5, // Minimum allowed
        carbsPct: 15,
        proteinGrams: 400, // (2000 * 80 / 100) / 4
        fatGrams: 11, // (2000 * 5 / 100) / 9
        carbsGrams: 75, // (2000 * 15 / 100) / 4
      });

      jest.spyOn(service, 'getOrCreateDefault').mockResolvedValue(mockGoals);

      // Act
      const result = await controller.getGoals(user);

      // Assert
      expect(result.proteinPct).toBe(80);
      expect(result.fatPct).toBe(5);
      expect(result.carbsPct).toBe(15);
      expect(result.proteinPct + result.fatPct + result.carbsPct).toBe(100);
    });
  });

  describe('updateGoals', () => {
    it('should successfully update nutrition goals with valid data', async () => {
      // Arrange
      const user = createMockUser();
      const updateData: UpdateNutritionGoalsInputModel = {
        dailyKcalGoal: 2200,
        proteinPct: 35,
        fatPct: 25,
        carbsPct: 40,
      };
      const updatedGoals = createMockNutritionGoals({
        userId: user.userId,
        dailyKcalGoal: updateData.dailyKcalGoal,
        proteinPct: updateData.proteinPct,
        fatPct: updateData.fatPct,
        carbsPct: updateData.carbsPct,
        proteinGrams: 193, // (2200 * 35 / 100) / 4
        fatGrams: 61, // (2200 * 25 / 100) / 9
        carbsGrams: 220, // (2200 * 40 / 100) / 4
        updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      });

      jest.spyOn(service, 'updateGoals').mockResolvedValue(updatedGoals);

      // Act
      const result: NutritionGoalsOutputModel = await controller.updateGoals(user, updateData);

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual(updatedGoals);
      expect(result.dailyKcalGoal).toBe(2200);
      expect(result.proteinPct).toBe(35);
      expect(result.fatPct).toBe(25);
      expect(result.carbsPct).toBe(40);
      expect(result.proteinGrams).toBe(193);
      expect(result.fatGrams).toBe(61);
      expect(result.carbsGrams).toBe(220);
      expect(service.updateGoals).toHaveBeenCalledTimes(1);
      expect(service.updateGoals).toHaveBeenCalledWith(user.userId, {
        dailyKcalGoal: updateData.dailyKcalGoal,
        proteinPct: updateData.proteinPct,
        fatPct: updateData.fatPct,
        carbsPct: updateData.carbsPct,
      });
    });

    it('should successfully update goals when percentages sum to exactly 100', async () => {
      // Arrange
      const user = createMockUser();
      const updateData: UpdateNutritionGoalsInputModel = {
        dailyKcalGoal: 2000,
        proteinPct: 30,
        fatPct: 30,
        carbsPct: 40,
      };
      const updatedGoals = createMockNutritionGoals(updateData);

      jest.spyOn(service, 'updateGoals').mockResolvedValue(updatedGoals);

      // Act
      const result = await controller.updateGoals(user, updateData);

      // Assert
      expect(result).toBeDefined();
      expect(result.proteinPct + result.fatPct + result.carbsPct).toBe(100);
      expect(service.updateGoals).toHaveBeenCalledWith(user.userId, {
        dailyKcalGoal: updateData.dailyKcalGoal,
        proteinPct: updateData.proteinPct,
        fatPct: updateData.fatPct,
        carbsPct: updateData.carbsPct,
      });
    });

    it('should throw DomainException with ValidationError when percentages sum to less than 100', async () => {
      // Arrange
      const user = createMockUser();
      const updateData: UpdateNutritionGoalsInputModel = {
        dailyKcalGoal: 2000,
        proteinPct: 25,
        fatPct: 25,
        carbsPct: 30, // Sum = 80, not 100
      };
      const validationException = new DomainException({
        code: DomainExceptionCode.ValidationError,
        message: 'Macronutrient percentages must sum to 100, got 80',
        extensions: [
          { key: 'proteinPct', message: 'Current value: 25' },
          { key: 'fatPct', message: 'Current value: 25' },
          { key: 'carbsPct', message: 'Current value: 30' },
        ],
      });

      jest.spyOn(service, 'updateGoals').mockRejectedValue(validationException);

      // Act & Assert
      await expect(controller.updateGoals(user, updateData)).rejects.toThrow(DomainException);
      await expect(controller.updateGoals(user, updateData)).rejects.toThrow(
        'Macronutrient percentages must sum to 100, got 80',
      );
      await expect(controller.updateGoals(user, updateData)).rejects.toMatchObject({
        code: DomainExceptionCode.ValidationError,
      });

      expect(service.updateGoals).toHaveBeenCalledWith(user.userId, {
        dailyKcalGoal: updateData.dailyKcalGoal,
        proteinPct: updateData.proteinPct,
        fatPct: updateData.fatPct,
        carbsPct: updateData.carbsPct,
      });
    });

    it('should throw DomainException with ValidationError when percentages sum to more than 100', async () => {
      // Arrange
      const user = createMockUser();
      const updateData: UpdateNutritionGoalsInputModel = {
        dailyKcalGoal: 2000,
        proteinPct: 40,
        fatPct: 40,
        carbsPct: 30, // Sum = 110, not 100
      };
      const validationException = new DomainException({
        code: DomainExceptionCode.ValidationError,
        message: 'Macronutrient percentages must sum to 100, got 110',
        extensions: [
          { key: 'proteinPct', message: 'Current value: 40' },
          { key: 'fatPct', message: 'Current value: 40' },
          { key: 'carbsPct', message: 'Current value: 30' },
        ],
      });

      jest.spyOn(service, 'updateGoals').mockRejectedValue(validationException);

      // Act & Assert
      await expect(controller.updateGoals(user, updateData)).rejects.toThrow(DomainException);
      await expect(controller.updateGoals(user, updateData)).rejects.toThrow(
        'Macronutrient percentages must sum to 100, got 110',
      );
      await expect(controller.updateGoals(user, updateData)).rejects.toMatchObject({
        code: DomainExceptionCode.ValidationError,
        extensions: [
          { key: 'proteinPct', message: 'Current value: 40' },
          { key: 'fatPct', message: 'Current value: 40' },
          { key: 'carbsPct', message: 'Current value: 30' },
        ],
      });

      expect(service.updateGoals).toHaveBeenCalledWith(user.userId, {
        dailyKcalGoal: updateData.dailyKcalGoal,
        proteinPct: updateData.proteinPct,
        fatPct: updateData.fatPct,
        carbsPct: updateData.carbsPct,
      });
    });

    it('should successfully update goals with minimum valid calorie goal', async () => {
      // Arrange
      const user = createMockUser();
      const updateData: UpdateNutritionGoalsInputModel = {
        dailyKcalGoal: 1000, // Minimum allowed
        proteinPct: 30,
        fatPct: 30,
        carbsPct: 40,
      };
      const updatedGoals = createMockNutritionGoals({
        userId: user.userId,
        dailyKcalGoal: 1000,
        proteinGrams: 75,
        fatGrams: 33,
        carbsGrams: 100,
      });

      jest.spyOn(service, 'updateGoals').mockResolvedValue(updatedGoals);

      // Act
      const result = await controller.updateGoals(user, updateData);

      // Assert
      expect(result.dailyKcalGoal).toBe(1000);
      expect(service.updateGoals).toHaveBeenCalledWith(user.userId, {
        dailyKcalGoal: 1000,
        proteinPct: 30,
        fatPct: 30,
        carbsPct: 40,
      });
    });

    it('should successfully update goals with maximum valid calorie goal', async () => {
      // Arrange
      const user = createMockUser();
      const updateData: UpdateNutritionGoalsInputModel = {
        dailyKcalGoal: 10000, // Maximum allowed
        proteinPct: 30,
        fatPct: 30,
        carbsPct: 40,
      };
      const updatedGoals = createMockNutritionGoals({
        userId: user.userId,
        dailyKcalGoal: 10000,
        proteinGrams: 750,
        fatGrams: 333,
        carbsGrams: 1000,
      });

      jest.spyOn(service, 'updateGoals').mockResolvedValue(updatedGoals);

      // Act
      const result = await controller.updateGoals(user, updateData);

      // Assert
      expect(result.dailyKcalGoal).toBe(10000);
      expect(service.updateGoals).toHaveBeenCalledWith(user.userId, {
        dailyKcalGoal: 10000,
        proteinPct: 30,
        fatPct: 30,
        carbsPct: 40,
      });
    });

    it('should successfully update goals with minimum valid macro percentages', async () => {
      // Arrange
      const user = createMockUser();
      const updateData: UpdateNutritionGoalsInputModel = {
        dailyKcalGoal: 2000,
        proteinPct: 5, // Minimum allowed
        fatPct: 5, // Minimum allowed
        carbsPct: 90,
      };
      const updatedGoals = createMockNutritionGoals({
        userId: user.userId,
        proteinPct: 5,
        fatPct: 5,
        carbsPct: 90,
        proteinGrams: 25, // (2000 * 5 / 100) / 4
        fatGrams: 11, // (2000 * 5 / 100) / 9
        carbsGrams: 450, // (2000 * 90 / 100) / 4
      });

      jest.spyOn(service, 'updateGoals').mockResolvedValue(updatedGoals);

      // Act
      const result = await controller.updateGoals(user, updateData);

      // Assert
      expect(result.proteinPct).toBe(5);
      expect(result.fatPct).toBe(5);
      expect(result.carbsPct).toBe(90);
      expect(result.proteinPct + result.fatPct + result.carbsPct).toBe(100);
    });

    it('should successfully update goals with maximum valid macro percentages', async () => {
      // Arrange
      const user = createMockUser();
      const updateData: UpdateNutritionGoalsInputModel = {
        dailyKcalGoal: 2000,
        proteinPct: 80, // Maximum allowed
        fatPct: 10,
        carbsPct: 10,
      };
      const updatedGoals = createMockNutritionGoals({
        userId: user.userId,
        proteinPct: 80,
        fatPct: 10,
        carbsPct: 10,
        proteinGrams: 400, // (2000 * 80 / 100) / 4
        fatGrams: 22, // (2000 * 10 / 100) / 9
        carbsGrams: 50, // (2000 * 10 / 100) / 4
      });

      jest.spyOn(service, 'updateGoals').mockResolvedValue(updatedGoals);

      // Act
      const result = await controller.updateGoals(user, updateData);

      // Assert
      expect(result.proteinPct).toBe(80);
      expect(result.fatPct).toBe(10);
      expect(result.carbsPct).toBe(10);
      expect(result.proteinPct + result.fatPct + result.carbsPct).toBe(100);
    });

    it('should update goals for different users independently', async () => {
      // Arrange
      const user1 = createMockUser({ userId: 'user-id-1' });
      const user2 = createMockUser({ userId: 'user-id-2' });
      const updateData1: UpdateNutritionGoalsInputModel = {
        dailyKcalGoal: 1800,
        proteinPct: 35,
        fatPct: 25,
        carbsPct: 40,
      };
      const updateData2: UpdateNutritionGoalsInputModel = {
        dailyKcalGoal: 2400,
        proteinPct: 25,
        fatPct: 35,
        carbsPct: 40,
      };
      const updatedGoals1 = createMockNutritionGoals({
        userId: 'user-id-1',
        dailyKcalGoal: 1800,
      });
      const updatedGoals2 = createMockNutritionGoals({
        userId: 'user-id-2',
        dailyKcalGoal: 2400,
      });

      jest
        .spyOn(service, 'updateGoals')
        .mockResolvedValueOnce(updatedGoals1)
        .mockResolvedValueOnce(updatedGoals2);

      // Act
      const result1 = await controller.updateGoals(user1, updateData1);
      const result2 = await controller.updateGoals(user2, updateData2);

      // Assert
      expect(result1.userId).toBe('user-id-1');
      expect(result1.dailyKcalGoal).toBe(1800);
      expect(result2.userId).toBe('user-id-2');
      expect(result2.dailyKcalGoal).toBe(2400);
      expect(service.updateGoals).toHaveBeenCalledTimes(2);
      expect(service.updateGoals).toHaveBeenNthCalledWith(1, 'user-id-1', {
        dailyKcalGoal: 1800,
        proteinPct: 35,
        fatPct: 25,
        carbsPct: 40,
      });
      expect(service.updateGoals).toHaveBeenNthCalledWith(2, 'user-id-2', {
        dailyKcalGoal: 2400,
        proteinPct: 25,
        fatPct: 35,
        carbsPct: 40,
      });
    });

    it('should correctly recalculate grams when updating calorie goal', async () => {
      // Arrange
      const user = createMockUser();
      const updateData: UpdateNutritionGoalsInputModel = {
        dailyKcalGoal: 3000, // Increased calories
        proteinPct: 30,
        fatPct: 30,
        carbsPct: 40,
      };
      const updatedGoals = createMockNutritionGoals({
        userId: user.userId,
        dailyKcalGoal: 3000,
        proteinGrams: 225, // (3000 * 30 / 100) / 4
        fatGrams: 100, // (3000 * 30 / 100) / 9
        carbsGrams: 300, // (3000 * 40 / 100) / 4
      });

      jest.spyOn(service, 'updateGoals').mockResolvedValue(updatedGoals);

      // Act
      const result = await controller.updateGoals(user, updateData);

      // Assert
      expect(result.dailyKcalGoal).toBe(3000);
      expect(result.proteinGrams).toBe(225);
      expect(result.fatGrams).toBe(100);
      expect(result.carbsGrams).toBe(300);
    });

    it('should handle upsert scenario when user has no existing goals', async () => {
      // Arrange
      const user = createMockUser({ userId: 'new-user-id' });
      const updateData: UpdateNutritionGoalsInputModel = {
        dailyKcalGoal: 2100,
        proteinPct: 30,
        fatPct: 30,
        carbsPct: 40,
      };
      const newGoals = createMockNutritionGoals({
        userId: 'new-user-id',
        dailyKcalGoal: 2100,
        proteinGrams: 158, // (2100 * 30 / 100) / 4
        fatGrams: 70, // (2100 * 30 / 100) / 9
        carbsGrams: 210, // (2100 * 40 / 100) / 4
      });

      jest.spyOn(service, 'updateGoals').mockResolvedValue(newGoals);

      // Act
      const result = await controller.updateGoals(user, updateData);

      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe('new-user-id');
      expect(result.dailyKcalGoal).toBe(2100);
      expect(service.updateGoals).toHaveBeenCalledWith('new-user-id', {
        dailyKcalGoal: 2100,
        proteinPct: 30,
        fatPct: 30,
        carbsPct: 40,
      });
    });

    it('should update timestamp when goals are modified', async () => {
      // Arrange
      const user = createMockUser();
      const updateData: UpdateNutritionGoalsInputModel = {
        dailyKcalGoal: 2000,
        proteinPct: 30,
        fatPct: 30,
        carbsPct: 40,
      };
      const oldDate = new Date('2024-01-01T00:00:00.000Z');
      const newDate = new Date('2024-01-15T12:00:00.000Z');
      const updatedGoals = createMockNutritionGoals({
        createdAt: oldDate,
        updatedAt: newDate,
      });

      jest.spyOn(service, 'updateGoals').mockResolvedValue(updatedGoals);

      // Act
      const result = await controller.updateGoals(user, updateData);

      // Assert
      expect(result.createdAt).toEqual(oldDate);
      expect(result.updatedAt).toEqual(newDate);
      expect(result.updatedAt.getTime()).toBeGreaterThan(result.createdAt.getTime());
    });

    it('should handle edge case with all macros at minimum except one', async () => {
      // Arrange
      const user = createMockUser();
      const updateData: UpdateNutritionGoalsInputModel = {
        dailyKcalGoal: 2000,
        proteinPct: 5, // Minimum
        fatPct: 5, // Minimum
        carbsPct: 90, // Makes total 100
      };
      const updatedGoals = createMockNutritionGoals({
        proteinPct: 5,
        fatPct: 5,
        carbsPct: 90,
        proteinGrams: 25,
        fatGrams: 11,
        carbsGrams: 450,
      });

      jest.spyOn(service, 'updateGoals').mockResolvedValue(updatedGoals);

      // Act
      const result = await controller.updateGoals(user, updateData);

      // Assert
      expect(result.proteinPct + result.fatPct + result.carbsPct).toBe(100);
      expect(result.proteinPct).toBe(5);
      expect(result.fatPct).toBe(5);
      expect(result.carbsPct).toBe(90);
    });
  });
});
