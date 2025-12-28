/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DaysController } from './days.controller';
import { DaysService } from '../application/days.service';
import { MealsService } from '../../meals/application/meals.service';
import { DayEntryOutputModel } from './models/output/day-entry.output.model';
import { MealOutputModel } from '../../meals/api/models/output/meal.output.model';
import { CreateMealInputModel } from '../../meals/api/models/input/create-meal.input.model';
import { GetDayByDateParams } from './models/input/get-day-by-date-params.input-dto';
import { CurrentUserType } from '../../auth/api/types/request-with-user.type';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';
import { MealType, MealSource } from '../../meals/domain/meal.entity';
import { FoodItemOutputModel } from '../../meals/api/models/output/food-item.output.model';

describe('DaysController', () => {
  let controller: DaysController;
  let daysService: DaysService;
  let mealsService: MealsService;

  // Mock data factory for DayEntry
  const createMockDayEntry = (overrides?: Partial<DayEntryOutputModel>): DayEntryOutputModel => {
    return {
      id: '507f1f77bcf86cd799439011',
      userId: '507f1f77bcf86cd799439001',
      date: '2025-10-20',
      targetKcal: 2000,
      consumedKcal: 1650,
      notes: 'Test notes',
      createdAt: new Date('2025-10-20T00:00:00.000Z'),
      updatedAt: new Date('2025-10-20T14:30:00.000Z'),
      ...overrides,
    };
  };

  // Mock data factory for Meal
  const createMockMeal = (overrides?: Partial<MealOutputModel>): MealOutputModel => {
    const mockFoodItem: FoodItemOutputModel = {
      id: '507f1f77bcf86cd799439021',
      productId: '507f1f77bcf86cd799439030',
      name: 'Oatmeal',
      quantity: 100,
      unit: 'g',
      kcal: 350,
      protein: 12.5,
      fat: 6.2,
      carbs: 58.3,
      source: 'usda',
    };

    return {
      id: '507f1f77bcf86cd799439020',
      dayEntryId: '507f1f77bcf86cd799439011',
      type: MealType.BREAKFAST,
      time: '08:30',
      name: 'Breakfast Oatmeal',
      items: [mockFoodItem],
      totalKcal: 350,
      source: MealSource.MANUAL,
      createdAt: new Date('2025-10-20T08:30:00.000Z'),
      updatedAt: new Date('2025-10-20T08:30:00.000Z'),
      ...overrides,
    };
  };

  // Mock current user
  const createMockCurrentUser = (overrides?: Partial<CurrentUserType>): CurrentUserType => {
    return {
      userId: '507f1f77bcf86cd799439001',
      email: 'test@example.com',
      ...overrides,
    };
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DaysController],
      providers: [
        {
          provide: DaysService,
          useValue: {
            getDayWithMeals: jest.fn(),
            getByUserAndDate: jest.fn(),
            getOrCreate: jest.fn(),
            updateConsumedKcal: jest.fn(),
            checkOwnership: jest.fn(),
            getById: jest.fn(),
          },
        },
        {
          provide: MealsService,
          useValue: {
            createMealForDate: jest.fn(),
            getById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DaysController>(DaysController);
    daysService = module.get<DaysService>(DaysService);
    mealsService = module.get<MealsService>(MealsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDayEntry', () => {
    it('should return day entry with meals for valid date', async () => {
      // Arrange
      const params: GetDayByDateParams = { date: '2025-10-20' };
      const currentUser = createMockCurrentUser();
      const mockMeal1 = createMockMeal({
        id: '507f1f77bcf86cd799439020',
        type: MealType.BREAKFAST,
        name: 'Morning Oatmeal',
        totalKcal: 350,
      });
      const mockMeal2 = createMockMeal({
        id: '507f1f77bcf86cd799439021',
        type: MealType.LUNCH,
        name: 'Chicken Salad',
        totalKcal: 550,
        time: '13:00',
      });
      const mockDayEntry = createMockDayEntry({
        date: params.date,
        userId: currentUser.userId,
        consumedKcal: 900,
        meals: [mockMeal1, mockMeal2],
      });

      jest.spyOn(daysService, 'getDayWithMeals').mockResolvedValue(mockDayEntry);

      // Act
      const result = await controller.getDayEntry(params, currentUser);

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual(mockDayEntry);
      expect(result?.meals).toHaveLength(2);
      expect(result?.consumedKcal).toBe(900);
      expect(daysService.getDayWithMeals).toHaveBeenCalledTimes(1);
      expect(daysService.getDayWithMeals).toHaveBeenCalledWith(currentUser.userId, params.date);
    });

    it('should return null when day entry does not exist', async () => {
      // Arrange
      const params: GetDayByDateParams = { date: '2025-10-21' };
      const currentUser = createMockCurrentUser();

      jest.spyOn(daysService, 'getDayWithMeals').mockResolvedValue(null);

      // Act
      const result = await controller.getDayEntry(params, currentUser);

      // Assert
      expect(result).toBeNull();
      expect(daysService.getDayWithMeals).toHaveBeenCalledTimes(1);
      expect(daysService.getDayWithMeals).toHaveBeenCalledWith(currentUser.userId, params.date);
    });

    it('should return day entry with empty meals array when no meals exist', async () => {
      // Arrange
      const params: GetDayByDateParams = { date: '2025-10-22' };
      const currentUser = createMockCurrentUser();
      const mockDayEntry = createMockDayEntry({
        date: params.date,
        consumedKcal: 0,
        meals: [],
      });

      jest.spyOn(daysService, 'getDayWithMeals').mockResolvedValue(mockDayEntry);

      // Act
      const result = await controller.getDayEntry(params, currentUser);

      // Assert
      expect(result).toBeDefined();
      expect(result?.meals).toEqual([]);
      expect(result?.consumedKcal).toBe(0);
      expect(daysService.getDayWithMeals).toHaveBeenCalledWith(currentUser.userId, params.date);
    });

    it('should handle different user IDs correctly', async () => {
      // Arrange
      const params: GetDayByDateParams = { date: '2025-10-20' };
      const user1 = createMockCurrentUser({ userId: 'user-id-1' });
      const user2 = createMockCurrentUser({ userId: 'user-id-2' });
      const dayEntry1 = createMockDayEntry({ userId: 'user-id-1', consumedKcal: 1000 });
      const dayEntry2 = createMockDayEntry({ userId: 'user-id-2', consumedKcal: 1500 });

      jest
        .spyOn(daysService, 'getDayWithMeals')
        .mockResolvedValueOnce(dayEntry1)
        .mockResolvedValueOnce(dayEntry2);

      // Act
      const result1 = await controller.getDayEntry(params, user1);
      const result2 = await controller.getDayEntry(params, user2);

      // Assert
      expect(result1?.userId).toBe('user-id-1');
      expect(result1?.consumedKcal).toBe(1000);
      expect(result2?.userId).toBe('user-id-2');
      expect(result2?.consumedKcal).toBe(1500);
      expect(daysService.getDayWithMeals).toHaveBeenNthCalledWith(1, 'user-id-1', params.date);
      expect(daysService.getDayWithMeals).toHaveBeenNthCalledWith(2, 'user-id-2', params.date);
    });

    it('should return day entry with targetKcal when set', async () => {
      // Arrange
      const params: GetDayByDateParams = { date: '2025-10-20' };
      const currentUser = createMockCurrentUser();
      const mockDayEntry = createMockDayEntry({
        targetKcal: 2500,
        consumedKcal: 1800,
      });

      jest.spyOn(daysService, 'getDayWithMeals').mockResolvedValue(mockDayEntry);

      // Act
      const result = await controller.getDayEntry(params, currentUser);

      // Assert
      expect(result?.targetKcal).toBe(2500);
      expect(result?.consumedKcal).toBe(1800);
    });

    it('should return day entry without targetKcal when not set', async () => {
      // Arrange
      const params: GetDayByDateParams = { date: '2025-10-20' };
      const currentUser = createMockCurrentUser();
      const mockDayEntry = createMockDayEntry({
        targetKcal: undefined,
        consumedKcal: 1200,
      });

      jest.spyOn(daysService, 'getDayWithMeals').mockResolvedValue(mockDayEntry);

      // Act
      const result = await controller.getDayEntry(params, currentUser);

      // Assert
      expect(result?.targetKcal).toBeUndefined();
      expect(result?.consumedKcal).toBe(1200);
    });

    it('should handle service throwing DomainException', async () => {
      // Arrange
      const params: GetDayByDateParams = { date: '2025-10-20' };
      const currentUser = createMockCurrentUser();
      const domainException = new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: 'Database connection failed',
      });

      jest.spyOn(daysService, 'getDayWithMeals').mockRejectedValue(domainException);

      // Act & Assert
      await expect(controller.getDayEntry(params, currentUser)).rejects.toThrow(DomainException);
      await expect(controller.getDayEntry(params, currentUser)).rejects.toMatchObject({
        code: DomainExceptionCode.InternalServerError,
        message: 'Database connection failed',
      });
    });
  });

  describe('createMeal', () => {
    it('should successfully create a meal with all fields', async () => {
      // Arrange
      const params: GetDayByDateParams = { date: '2025-10-20' };
      const currentUser = createMockCurrentUser();
      const createMealInput: CreateMealInputModel = {
        type: 'breakfast',
        time: '08:30',
        name: 'Morning Oatmeal',
        items: [
          {
            productId: '507f1f77bcf86cd799439030',
            quantity: 100,
          },
        ],
        source: 'manual',
      };
      const mockCreatedMeal = createMockMeal({
        type: MealType.BREAKFAST,
        time: '08:30',
        name: 'Morning Oatmeal',
        source: MealSource.MANUAL,
      });

      jest.spyOn(mealsService, 'createMealForDate').mockResolvedValue(mockCreatedMeal);

      // Act
      const result = await controller.createMeal(params, createMealInput, currentUser);

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual(mockCreatedMeal);
      expect(result.type).toBe(MealType.BREAKFAST);
      expect(result.time).toBe('08:30');
      expect(result.name).toBe('Morning Oatmeal');
      expect(result.source).toBe(MealSource.MANUAL);
      expect(mealsService.createMealForDate).toHaveBeenCalledTimes(1);
      expect(mealsService.createMealForDate).toHaveBeenCalledWith(currentUser.userId, params.date, {
        type: MealType.BREAKFAST,
        time: '08:30',
        name: 'Morning Oatmeal',
        items: createMealInput.items,
        source: MealSource.MANUAL,
        aiConfidence: undefined,
      });
    });

    it('should successfully create a meal with only required fields', async () => {
      // Arrange
      const params: GetDayByDateParams = { date: '2025-10-20' };
      const currentUser = createMockCurrentUser();
      const createMealInput: CreateMealInputModel = {
        type: 'lunch',
        items: [
          {
            productId: '507f1f77bcf86cd799439031',
            quantity: 150,
          },
        ],
        source: 'manual',
      };
      const mockCreatedMeal = createMockMeal({
        type: MealType.LUNCH,
        time: undefined,
        name: undefined,
        source: MealSource.MANUAL,
      });

      jest.spyOn(mealsService, 'createMealForDate').mockResolvedValue(mockCreatedMeal);

      // Act
      const result = await controller.createMeal(params, createMealInput, currentUser);

      // Assert
      expect(result).toBeDefined();
      expect(result.type).toBe(MealType.LUNCH);
      expect(result.time).toBeUndefined();
      expect(result.name).toBeUndefined();
      expect(mealsService.createMealForDate).toHaveBeenCalledWith(currentUser.userId, params.date, {
        type: MealType.LUNCH,
        time: undefined,
        name: undefined,
        items: createMealInput.items,
        source: MealSource.MANUAL,
        aiConfidence: undefined,
      });
    });

    it('should create meal with AI source and confidence score', async () => {
      // Arrange
      const params: GetDayByDateParams = { date: '2025-10-20' };
      const currentUser = createMockCurrentUser();
      const createMealInput: CreateMealInputModel = {
        type: 'dinner',
        name: 'AI Detected Meal',
        items: [
          {
            productId: '507f1f77bcf86cd799439032',
            quantity: 200,
          },
        ],
        source: 'ai',
        aiConfidence: 0.95,
      };
      const mockCreatedMeal = createMockMeal({
        type: MealType.DINNER,
        name: 'AI Detected Meal',
        source: MealSource.AI,
        aiConfidence: 0.95,
      });

      jest.spyOn(mealsService, 'createMealForDate').mockResolvedValue(mockCreatedMeal);

      // Act
      const result = await controller.createMeal(params, createMealInput, currentUser);

      // Assert
      expect(result).toBeDefined();
      expect(result.source).toBe(MealSource.AI);
      expect(result.aiConfidence).toBe(0.95);
      expect(mealsService.createMealForDate).toHaveBeenCalledWith(currentUser.userId, params.date, {
        type: MealType.DINNER,
        time: undefined,
        name: 'AI Detected Meal',
        items: createMealInput.items,
        source: MealSource.AI,
        aiConfidence: 0.95,
      });
    });

    it('should create meal with multiple items', async () => {
      // Arrange
      const params: GetDayByDateParams = { date: '2025-10-20' };
      const currentUser = createMockCurrentUser();
      const createMealInput: CreateMealInputModel = {
        type: 'lunch',
        name: 'Complex Meal',
        items: [
          {
            productId: '507f1f77bcf86cd799439030',
            quantity: 100,
          },
          {
            productId: '507f1f77bcf86cd799439031',
            quantity: 150,
          },
          {
            productId: '507f1f77bcf86cd799439032',
            quantity: 75,
          },
        ],
        source: 'manual',
      };
      const mockMeal1: FoodItemOutputModel = {
        id: '1',
        productId: '507f1f77bcf86cd799439030',
        name: 'Product 1',
        quantity: 100,
        unit: 'g',
        kcal: 200,
        protein: 10,
        fat: 5,
        carbs: 25,
        source: 'usda',
      };
      const mockMeal2: FoodItemOutputModel = {
        id: '2',
        productId: '507f1f77bcf86cd799439031',
        name: 'Product 2',
        quantity: 150,
        unit: 'g',
        kcal: 300,
        protein: 15,
        fat: 10,
        carbs: 35,
        source: 'usda',
      };
      const mockMeal3: FoodItemOutputModel = {
        id: '3',
        productId: '507f1f77bcf86cd799439032',
        name: 'Product 3',
        quantity: 75,
        unit: 'g',
        kcal: 150,
        protein: 8,
        fat: 3,
        carbs: 20,
        source: 'usda',
      };
      const mockCreatedMeal = createMockMeal({
        name: 'Complex Meal',
        items: [mockMeal1, mockMeal2, mockMeal3],
        totalKcal: 650,
      });

      jest.spyOn(mealsService, 'createMealForDate').mockResolvedValue(mockCreatedMeal);

      // Act
      const result = await controller.createMeal(params, createMealInput, currentUser);

      // Assert
      expect(result).toBeDefined();
      expect(result.items).toHaveLength(3);
      expect(result.totalKcal).toBe(650);
      expect(mealsService.createMealForDate).toHaveBeenCalledWith(
        currentUser.userId,
        params.date,
        expect.objectContaining({
          items: createMealInput.items,
        }),
      );
    });

    it('should handle all meal types correctly', async () => {
      // Arrange
      const params: GetDayByDateParams = { date: '2025-10-20' };
      const currentUser = createMockCurrentUser();
      const mealTypes: Array<{ type: string; enumValue: MealType }> = [
        { type: 'breakfast', enumValue: MealType.BREAKFAST },
        { type: 'lunch', enumValue: MealType.LUNCH },
        { type: 'dinner', enumValue: MealType.DINNER },
        { type: 'snack', enumValue: MealType.SNACK },
        { type: 'other', enumValue: MealType.OTHER },
      ];

      for (const mealType of mealTypes) {
        const createMealInput: CreateMealInputModel = {
          type: mealType.type,
          items: [{ productId: '507f1f77bcf86cd799439030', quantity: 100 }],
          source: 'manual',
        };
        const mockCreatedMeal = createMockMeal({ type: mealType.enumValue });

        jest.spyOn(mealsService, 'createMealForDate').mockResolvedValue(mockCreatedMeal);

        // Act
        const result = await controller.createMeal(params, createMealInput, currentUser);

        // Assert
        expect(result.type).toBe(mealType.enumValue);
        expect(mealsService.createMealForDate).toHaveBeenCalledWith(
          currentUser.userId,
          params.date,
          expect.objectContaining({
            type: mealType.enumValue,
          }),
        );

        jest.clearAllMocks();
      }
    });

    it('should throw DomainException when product not found', async () => {
      // Arrange
      const params: GetDayByDateParams = { date: '2025-10-20' };
      const currentUser = createMockCurrentUser();
      const createMealInput: CreateMealInputModel = {
        type: 'breakfast',
        items: [
          {
            productId: 'nonexistent-product-id',
            quantity: 100,
          },
        ],
        source: 'manual',
      };
      const notFoundException = new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'product not found',
      });

      jest.spyOn(mealsService, 'createMealForDate').mockRejectedValue(notFoundException);

      // Act & Assert
      await expect(controller.createMeal(params, createMealInput, currentUser)).rejects.toThrow(
        DomainException,
      );
      await expect(controller.createMeal(params, createMealInput, currentUser)).rejects.toThrow(
        'product not found',
      );
      await expect(
        controller.createMeal(params, createMealInput, currentUser),
      ).rejects.toMatchObject({
        code: DomainExceptionCode.NotFound,
      });
    });

    it('should throw DomainException when recipe is provided (not implemented)', async () => {
      // Arrange
      const params: GetDayByDateParams = { date: '2025-10-20' };
      const currentUser = createMockCurrentUser();
      const createMealInput: CreateMealInputModel = {
        type: 'lunch',
        items: [
          {
            recipeId: '507f1f77bcf86cd799439040',
            quantity: 1,
          },
        ],
        source: 'manual',
      };
      const badRequestException = new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Recipe support is not implemented yet',
      });

      jest.spyOn(mealsService, 'createMealForDate').mockRejectedValue(badRequestException);

      // Act & Assert
      await expect(controller.createMeal(params, createMealInput, currentUser)).rejects.toThrow(
        DomainException,
      );
      await expect(controller.createMeal(params, createMealInput, currentUser)).rejects.toThrow(
        'Recipe support is not implemented yet',
      );
      await expect(
        controller.createMeal(params, createMealInput, currentUser),
      ).rejects.toMatchObject({
        code: DomainExceptionCode.BadRequest,
      });
    });

    it('should throw DomainException when neither productId nor recipeId provided', async () => {
      // Arrange
      const params: GetDayByDateParams = { date: '2025-10-20' };
      const currentUser = createMockCurrentUser();
      const createMealInput: CreateMealInputModel = {
        type: 'breakfast',
        items: [
          {
            quantity: 100,
          } as any, // Simulating invalid input
        ],
        source: 'manual',
      };
      const badRequestException = new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Either productId or recipeId must be provided',
      });

      jest.spyOn(mealsService, 'createMealForDate').mockRejectedValue(badRequestException);

      // Act & Assert
      await expect(controller.createMeal(params, createMealInput, currentUser)).rejects.toThrow(
        DomainException,
      );
      await expect(
        controller.createMeal(params, createMealInput, currentUser),
      ).rejects.toMatchObject({
        code: DomainExceptionCode.BadRequest,
      });
    });

    it('should handle different dates correctly', async () => {
      // Arrange
      const dates = ['2025-01-15', '2025-06-30', '2025-12-25'];
      const currentUser = createMockCurrentUser();

      for (const date of dates) {
        const params: GetDayByDateParams = { date };
        const createMealInput: CreateMealInputModel = {
          type: 'breakfast',
          items: [{ productId: '507f1f77bcf86cd799439030', quantity: 100 }],
          source: 'manual',
        };
        const mockCreatedMeal = createMockMeal();

        jest.spyOn(mealsService, 'createMealForDate').mockResolvedValue(mockCreatedMeal);

        // Act
        await controller.createMeal(params, createMealInput, currentUser);

        // Assert
        expect(mealsService.createMealForDate).toHaveBeenCalledWith(
          currentUser.userId,
          date,
          expect.any(Object),
        );

        jest.clearAllMocks();
      }
    });

    it('should pass correct time format to service', async () => {
      // Arrange
      const params: GetDayByDateParams = { date: '2025-10-20' };
      const currentUser = createMockCurrentUser();
      const times = ['00:00', '09:30', '14:45', '23:59'];

      for (const time of times) {
        const createMealInput: CreateMealInputModel = {
          type: 'snack',
          time,
          items: [{ productId: '507f1f77bcf86cd799439030', quantity: 50 }],
          source: 'manual',
        };
        const mockCreatedMeal = createMockMeal({ time });

        jest.spyOn(mealsService, 'createMealForDate').mockResolvedValue(mockCreatedMeal);

        // Act
        const result = await controller.createMeal(params, createMealInput, currentUser);

        // Assert
        expect(result.time).toBe(time);
        expect(mealsService.createMealForDate).toHaveBeenCalledWith(
          currentUser.userId,
          params.date,
          expect.objectContaining({
            time,
          }),
        );

        jest.clearAllMocks();
      }
    });

    it('should handle different users creating meals on same date', async () => {
      // Arrange
      const params: GetDayByDateParams = { date: '2025-10-20' };
      const user1 = createMockCurrentUser({ userId: 'user-id-1' });
      const user2 = createMockCurrentUser({ userId: 'user-id-2' });
      const createMealInput: CreateMealInputModel = {
        type: 'lunch',
        items: [{ productId: '507f1f77bcf86cd799439030', quantity: 100 }],
        source: 'manual',
      };
      const mockMeal1 = createMockMeal({ dayEntryId: 'day-entry-1' });
      const mockMeal2 = createMockMeal({ dayEntryId: 'day-entry-2' });

      jest
        .spyOn(mealsService, 'createMealForDate')
        .mockResolvedValueOnce(mockMeal1)
        .mockResolvedValueOnce(mockMeal2);

      // Act
      const result1 = await controller.createMeal(params, createMealInput, user1);
      const result2 = await controller.createMeal(params, createMealInput, user2);

      // Assert
      expect(result1.dayEntryId).toBe('day-entry-1');
      expect(result2.dayEntryId).toBe('day-entry-2');
      expect(mealsService.createMealForDate).toHaveBeenNthCalledWith(
        1,
        'user-id-1',
        params.date,
        expect.any(Object),
      );
      expect(mealsService.createMealForDate).toHaveBeenNthCalledWith(
        2,
        'user-id-2',
        params.date,
        expect.any(Object),
      );
    });

    it('should handle internal server errors from service', async () => {
      // Arrange
      const params: GetDayByDateParams = { date: '2025-10-20' };
      const currentUser = createMockCurrentUser();
      const createMealInput: CreateMealInputModel = {
        type: 'breakfast',
        items: [{ productId: '507f1f77bcf86cd799439030', quantity: 100 }],
        source: 'manual',
      };
      const internalException = new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: 'Database connection failed',
      });

      jest.spyOn(mealsService, 'createMealForDate').mockRejectedValue(internalException);

      // Act & Assert
      await expect(controller.createMeal(params, createMealInput, currentUser)).rejects.toThrow(
        DomainException,
      );
      await expect(
        controller.createMeal(params, createMealInput, currentUser),
      ).rejects.toMatchObject({
        code: DomainExceptionCode.InternalServerError,
        message: 'Database connection failed',
      });
    });

    it('should create meal and return correct timestamps', async () => {
      // Arrange
      const params: GetDayByDateParams = { date: '2025-10-20' };
      const currentUser = createMockCurrentUser();
      const createMealInput: CreateMealInputModel = {
        type: 'breakfast',
        items: [{ productId: '507f1f77bcf86cd799439030', quantity: 100 }],
        source: 'manual',
      };
      const createdAt = new Date('2025-10-20T08:00:00.000Z');
      const updatedAt = new Date('2025-10-20T08:00:00.000Z');
      const mockCreatedMeal = createMockMeal({
        createdAt,
        updatedAt,
      });

      jest.spyOn(mealsService, 'createMealForDate').mockResolvedValue(mockCreatedMeal);

      // Act
      const result = await controller.createMeal(params, createMealInput, currentUser);

      // Assert
      expect(result.createdAt).toEqual(createdAt);
      expect(result.updatedAt).toEqual(updatedAt);
    });

    it('should handle AI confidence score boundaries', async () => {
      // Arrange
      const params: GetDayByDateParams = { date: '2025-10-20' };
      const currentUser = createMockCurrentUser();
      const confidenceScores = [0, 0.5, 1];

      for (const aiConfidence of confidenceScores) {
        const createMealInput: CreateMealInputModel = {
          type: 'snack',
          items: [{ productId: '507f1f77bcf86cd799439030', quantity: 50 }],
          source: 'ai',
          aiConfidence,
        };
        const mockCreatedMeal = createMockMeal({
          source: MealSource.AI,
          aiConfidence,
        });

        jest.spyOn(mealsService, 'createMealForDate').mockResolvedValue(mockCreatedMeal);

        // Act
        const result = await controller.createMeal(params, createMealInput, currentUser);

        // Assert
        expect(result.aiConfidence).toBe(aiConfidence);
        expect(mealsService.createMealForDate).toHaveBeenCalledWith(
          currentUser.userId,
          params.date,
          expect.objectContaining({
            aiConfidence,
          }),
        );

        jest.clearAllMocks();
      }
    });
  });
});
