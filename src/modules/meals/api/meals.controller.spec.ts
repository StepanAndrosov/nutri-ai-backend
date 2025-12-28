/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { MealsController } from './meals.controller';
import { MealsService } from '../application/meals.service';
import { MealOutputModel } from './models/output/meal.output.model';
import { UpdateMealInputModel } from './models/input/update-meal.input.model';
import { GetMealByIdParams } from './input-dto/get-meal-by-id-params.input-dto';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';
import { CurrentUserType } from '../../auth/api/types/request-with-user.type';
import { FoodItemOutputModel } from './models/output/food-item.output.model';

describe('MealsController', () => {
  let controller: MealsController;
  let mealsService: MealsService;

  // Mock data factory for food items
  const createMockFoodItem = (overrides?: Partial<FoodItemOutputModel>): FoodItemOutputModel => {
    const foodItem = new FoodItemOutputModel();
    foodItem.id = '507f1f77bcf86cd799439015';
    foodItem.productId = '507f1f77bcf86cd799439020';
    foodItem.name = 'Овсянка';
    foodItem.quantity = 100;
    foodItem.unit = 'g';
    foodItem.kcal = 350;
    foodItem.protein = 12.5;
    foodItem.fat = 6.2;
    foodItem.carbs = 58.3;
    foodItem.source = 'product';
    return { ...foodItem, ...overrides };
  };

  // Mock data factory for meals
  const createMockMeal = (overrides?: Partial<MealOutputModel>): MealOutputModel => {
    const meal = new MealOutputModel();
    meal.id = '507f1f77bcf86cd799439011';
    meal.dayEntryId = '507f1f77bcf86cd799439012';
    meal.type = 'breakfast';
    meal.time = '08:30';
    meal.name = 'Овсянка с бананом';
    meal.items = [createMockFoodItem()];
    meal.totalKcal = 450;
    meal.source = 'manual';
    meal.aiConfidence = undefined;
    meal.createdAt = new Date('2024-01-01T08:30:00.000Z');
    meal.updatedAt = new Date('2024-01-01T08:30:00.000Z');
    return { ...meal, ...overrides };
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
      controllers: [MealsController],
      providers: [
        {
          provide: MealsService,
          useValue: {
            getById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MealsController>(MealsController);
    mealsService = module.get<MealsService>(MealsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMealById', () => {
    it('should successfully get meal by ID for the owner', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439011' };
      const user = createMockUser();
      const mockMeal = createMockMeal({ id: params.id });

      jest.spyOn(mealsService, 'getById').mockResolvedValue(mockMeal);

      // Act
      const result: MealOutputModel = await controller.getMealById(params, user);

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual(mockMeal);
      expect(result.id).toBe(params.id);
      expect(result.dayEntryId).toBe(mockMeal.dayEntryId);
      expect(result.type).toBe('breakfast');
      expect(result.totalKcal).toBe(450);
      expect(result.items).toHaveLength(1);
      expect(mealsService.getById).toHaveBeenCalledTimes(1);
      expect(mealsService.getById).toHaveBeenCalledWith(params.id, user.userId);
    });

    it('should successfully get meal with multiple food items', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439011' };
      const user = createMockUser();
      const foodItems = [
        createMockFoodItem({
          id: '507f1f77bcf86cd799439015',
          name: 'Овсянка',
          kcal: 350,
        }),
        createMockFoodItem({
          id: '507f1f77bcf86cd799439016',
          name: 'Банан',
          kcal: 100,
          productId: '507f1f77bcf86cd799439021',
        }),
      ];
      const mockMeal = createMockMeal({
        id: params.id,
        items: foodItems,
        totalKcal: 450,
      });

      jest.spyOn(mealsService, 'getById').mockResolvedValue(mockMeal);

      // Act
      const result = await controller.getMealById(params, user);

      // Assert
      expect(result.items).toHaveLength(2);
      expect(result.totalKcal).toBe(450);
      expect(mealsService.getById).toHaveBeenCalledWith(params.id, user.userId);
    });

    it('should successfully get meal with AI source and confidence', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439011' };
      const user = createMockUser();
      const mockMeal = createMockMeal({
        id: params.id,
        source: 'ai',
        aiConfidence: 0.95,
      });

      jest.spyOn(mealsService, 'getById').mockResolvedValue(mockMeal);

      // Act
      const result = await controller.getMealById(params, user);

      // Assert
      expect(result.source).toBe('ai');
      expect(result.aiConfidence).toBe(0.95);
      expect(mealsService.getById).toHaveBeenCalledWith(params.id, user.userId);
    });

    it('should successfully get meal with optional fields undefined', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439011' };
      const user = createMockUser();
      const mockMeal = createMockMeal({
        id: params.id,
        time: undefined,
        name: undefined,
        aiConfidence: undefined,
      });

      jest.spyOn(mealsService, 'getById').mockResolvedValue(mockMeal);

      // Act
      const result = await controller.getMealById(params, user);

      // Assert
      expect(result.time).toBeUndefined();
      expect(result.name).toBeUndefined();
      expect(result.aiConfidence).toBeUndefined();
      expect(mealsService.getById).toHaveBeenCalledWith(params.id, user.userId);
    });

    it('should throw DomainException with NotFound when meal does not exist', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439099' };
      const user = createMockUser();
      const notFoundException = new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'meal not found',
      });

      jest.spyOn(mealsService, 'getById').mockRejectedValue(notFoundException);

      // Act & Assert
      await expect(controller.getMealById(params, user)).rejects.toThrow(DomainException);
      await expect(controller.getMealById(params, user)).rejects.toThrow('meal not found');
      await expect(controller.getMealById(params, user)).rejects.toMatchObject({
        code: DomainExceptionCode.NotFound,
      });

      expect(mealsService.getById).toHaveBeenCalledWith(params.id, user.userId);
    });

    it('should throw DomainException with Forbidden when user does not own the meal', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439011' };
      const user = createMockUser({ userId: 'different-user-id' });
      const forbiddenException = new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'You can only access your own meals',
      });

      jest.spyOn(mealsService, 'getById').mockRejectedValue(forbiddenException);

      // Act & Assert
      await expect(controller.getMealById(params, user)).rejects.toThrow(DomainException);
      await expect(controller.getMealById(params, user)).rejects.toThrow(
        'You can only access your own meals',
      );
      await expect(controller.getMealById(params, user)).rejects.toMatchObject({
        code: DomainExceptionCode.Forbidden,
      });

      expect(mealsService.getById).toHaveBeenCalledWith(params.id, user.userId);
    });

    it('should get meal with different meal types', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439011' };
      const user = createMockUser();
      const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'other'];

      for (const type of mealTypes) {
        const mockMeal = createMockMeal({ type });
        jest.spyOn(mealsService, 'getById').mockResolvedValue(mockMeal);

        // Act
        const result = await controller.getMealById(params, user);

        // Assert
        expect(result.type).toBe(type);
      }
    });
  });

  describe('updateMeal', () => {
    it('should successfully update meal with all fields', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439011' };
      const user = createMockUser();
      const updateData: UpdateMealInputModel = {
        type: 'lunch',
        time: '13:00',
        name: 'Обновленный обед',
        items: [],
        totalKcal: 600,
        source: 'manual',
        aiConfidence: undefined,
      };
      const updatedMeal = createMockMeal({
        id: params.id,
        type: 'lunch',
        time: '13:00',
        name: 'Обновленный обед',
        totalKcal: 600,
        source: 'manual',
        updatedAt: new Date('2024-01-01T13:00:00.000Z'),
      });

      jest.spyOn(mealsService, 'update').mockResolvedValue(updatedMeal);

      // Act
      const result: MealOutputModel = await controller.updateMeal(params, updateData, user);

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual(updatedMeal);
      expect(result.type).toBe('lunch');
      expect(result.time).toBe('13:00');
      expect(result.name).toBe('Обновленный обед');
      expect(result.totalKcal).toBe(600);
      expect(mealsService.update).toHaveBeenCalledTimes(1);
      expect(mealsService.update).toHaveBeenCalledWith(params.id, user.userId, {
        type: updateData.type,
        time: updateData.time,
        name: updateData.name,
        items: updateData.items,
        totalKcal: updateData.totalKcal,
        source: updateData.source,
        aiConfidence: updateData.aiConfidence,
      });
    });

    it('should successfully update meal with only type field', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439011' };
      const user = createMockUser();
      const updateData: UpdateMealInputModel = {
        type: 'dinner',
      };
      const updatedMeal = createMockMeal({
        id: params.id,
        type: 'dinner',
      });

      jest.spyOn(mealsService, 'update').mockResolvedValue(updatedMeal);

      // Act
      const result = await controller.updateMeal(params, updateData, user);

      // Assert
      expect(result.type).toBe('dinner');
      expect(mealsService.update).toHaveBeenCalledWith(params.id, user.userId, {
        type: 'dinner',
        time: undefined,
        name: undefined,
        items: undefined,
        totalKcal: undefined,
        source: undefined,
        aiConfidence: undefined,
      });
    });

    it('should successfully update meal with only time field', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439011' };
      const user = createMockUser();
      const updateData: UpdateMealInputModel = {
        time: '19:45',
      };
      const updatedMeal = createMockMeal({
        id: params.id,
        time: '19:45',
      });

      jest.spyOn(mealsService, 'update').mockResolvedValue(updatedMeal);

      // Act
      const result = await controller.updateMeal(params, updateData, user);

      // Assert
      expect(result.time).toBe('19:45');
      expect(mealsService.update).toHaveBeenCalledWith(params.id, user.userId, {
        type: undefined,
        time: '19:45',
        name: undefined,
        items: undefined,
        totalKcal: undefined,
        source: undefined,
        aiConfidence: undefined,
      });
    });

    it('should successfully update meal with AI source and confidence', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439011' };
      const user = createMockUser();
      const updateData: UpdateMealInputModel = {
        source: 'ai',
        aiConfidence: 0.85,
      };
      const updatedMeal = createMockMeal({
        id: params.id,
        source: 'ai',
        aiConfidence: 0.85,
      });

      jest.spyOn(mealsService, 'update').mockResolvedValue(updatedMeal);

      // Act
      const result = await controller.updateMeal(params, updateData, user);

      // Assert
      expect(result.source).toBe('ai');
      expect(result.aiConfidence).toBe(0.85);
      expect(mealsService.update).toHaveBeenCalledWith(params.id, user.userId, {
        type: undefined,
        time: undefined,
        name: undefined,
        items: undefined,
        totalKcal: undefined,
        source: 'ai',
        aiConfidence: 0.85,
      });
    });

    it('should successfully update meal totalKcal', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439011' };
      const user = createMockUser();
      const updateData: UpdateMealInputModel = {
        totalKcal: 800,
      };
      const updatedMeal = createMockMeal({
        id: params.id,
        totalKcal: 800,
      });

      jest.spyOn(mealsService, 'update').mockResolvedValue(updatedMeal);

      // Act
      const result = await controller.updateMeal(params, updateData, user);

      // Assert
      expect(result.totalKcal).toBe(800);
      expect(mealsService.update).toHaveBeenCalledWith(params.id, user.userId, {
        type: undefined,
        time: undefined,
        name: undefined,
        items: undefined,
        totalKcal: 800,
        source: undefined,
        aiConfidence: undefined,
      });
    });

    it('should throw DomainException with NotFound when meal does not exist', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439099' };
      const user = createMockUser();
      const updateData: UpdateMealInputModel = { type: 'lunch' };
      const notFoundException = new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'meal not found',
      });

      jest.spyOn(mealsService, 'update').mockRejectedValue(notFoundException);

      // Act & Assert
      await expect(controller.updateMeal(params, updateData, user)).rejects.toThrow(
        DomainException,
      );
      await expect(controller.updateMeal(params, updateData, user)).rejects.toThrow(
        'meal not found',
      );
      await expect(controller.updateMeal(params, updateData, user)).rejects.toMatchObject({
        code: DomainExceptionCode.NotFound,
      });

      expect(mealsService.update).toHaveBeenCalledWith(params.id, user.userId, {
        type: 'lunch',
        time: undefined,
        name: undefined,
        items: undefined,
        totalKcal: undefined,
        source: undefined,
        aiConfidence: undefined,
      });
    });

    it('should throw DomainException with Forbidden when user does not own the meal', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439011' };
      const user = createMockUser({ userId: 'different-user-id' });
      const updateData: UpdateMealInputModel = { type: 'lunch' };
      const forbiddenException = new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'You can only update your own meals',
      });

      jest.spyOn(mealsService, 'update').mockRejectedValue(forbiddenException);

      // Act & Assert
      await expect(controller.updateMeal(params, updateData, user)).rejects.toThrow(
        DomainException,
      );
      await expect(controller.updateMeal(params, updateData, user)).rejects.toThrow(
        'You can only update your own meals',
      );
      await expect(controller.updateMeal(params, updateData, user)).rejects.toMatchObject({
        code: DomainExceptionCode.Forbidden,
      });

      expect(mealsService.update).toHaveBeenCalledWith(params.id, user.userId, {
        type: 'lunch',
        time: undefined,
        name: undefined,
        items: undefined,
        totalKcal: undefined,
        source: undefined,
        aiConfidence: undefined,
      });
    });

    it('should update meal with different meal types', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439011' };
      const user = createMockUser();
      const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'other'];

      for (const type of mealTypes) {
        const updateData: UpdateMealInputModel = { type };
        const updatedMeal = createMockMeal({ type });
        jest.spyOn(mealsService, 'update').mockResolvedValue(updatedMeal);

        // Act
        const result = await controller.updateMeal(params, updateData, user);

        // Assert
        expect(result.type).toBe(type);
      }
    });

    it('should pass empty items array when items field is provided', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439011' };
      const user = createMockUser();
      const updateData: UpdateMealInputModel = {
        items: [],
      };
      const updatedMeal = createMockMeal({
        id: params.id,
        items: [],
        totalKcal: 0,
      });

      jest.spyOn(mealsService, 'update').mockResolvedValue(updatedMeal);

      // Act
      const result = await controller.updateMeal(params, updateData, user);

      // Assert
      expect(result.items).toEqual([]);
      expect(mealsService.update).toHaveBeenCalledWith(params.id, user.userId, {
        type: undefined,
        time: undefined,
        name: undefined,
        items: [],
        totalKcal: undefined,
        source: undefined,
        aiConfidence: undefined,
      });
    });
  });

  describe('deleteMeal', () => {
    it('should successfully delete meal by ID for the owner', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439011' };
      const user = createMockUser();

      jest.spyOn(mealsService, 'delete').mockResolvedValue(undefined);

      // Act
      const result = await controller.deleteMeal(params, user);

      // Assert
      expect(result).toBeUndefined();
      expect(mealsService.delete).toHaveBeenCalledTimes(1);
      expect(mealsService.delete).toHaveBeenCalledWith(params.id, user.userId);
    });

    it('should return void when meal is successfully deleted', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439011' };
      const user = createMockUser();

      jest.spyOn(mealsService, 'delete').mockResolvedValue(undefined);

      // Act
      const result = await controller.deleteMeal(params, user);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should throw DomainException with NotFound when meal does not exist', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439099' };
      const user = createMockUser();
      const notFoundException = new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'meal not found',
      });

      jest.spyOn(mealsService, 'delete').mockRejectedValue(notFoundException);

      // Act & Assert
      await expect(controller.deleteMeal(params, user)).rejects.toThrow(DomainException);
      await expect(controller.deleteMeal(params, user)).rejects.toThrow('meal not found');
      await expect(controller.deleteMeal(params, user)).rejects.toMatchObject({
        code: DomainExceptionCode.NotFound,
      });

      expect(mealsService.delete).toHaveBeenCalledWith(params.id, user.userId);
    });

    it('should throw DomainException with Forbidden when user does not own the meal', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439011' };
      const user = createMockUser({ userId: 'different-user-id' });
      const forbiddenException = new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'You can only delete your own meals',
      });

      jest.spyOn(mealsService, 'delete').mockRejectedValue(forbiddenException);

      // Act & Assert
      await expect(controller.deleteMeal(params, user)).rejects.toThrow(DomainException);
      await expect(controller.deleteMeal(params, user)).rejects.toThrow(
        'You can only delete your own meals',
      );
      await expect(controller.deleteMeal(params, user)).rejects.toMatchObject({
        code: DomainExceptionCode.Forbidden,
      });

      expect(mealsService.delete).toHaveBeenCalledWith(params.id, user.userId);
    });

    it('should call delete service method with correct parameters', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: 'specific-meal-id-123' };
      const user = createMockUser({ userId: 'specific-user-id-456' });

      jest.spyOn(mealsService, 'delete').mockResolvedValue(undefined);

      // Act
      await controller.deleteMeal(params, user);

      // Assert
      expect(mealsService.delete).toHaveBeenCalledWith(
        'specific-meal-id-123',
        'specific-user-id-456',
      );
    });

    it('should successfully delete meals for different users', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439011' };
      const user1 = createMockUser({ userId: 'user-1' });
      const user2 = createMockUser({ userId: 'user-2' });

      jest.spyOn(mealsService, 'delete').mockResolvedValue(undefined);

      // Act
      await controller.deleteMeal(params, user1);
      await controller.deleteMeal(params, user2);

      // Assert
      expect(mealsService.delete).toHaveBeenCalledTimes(2);
      expect(mealsService.delete).toHaveBeenNthCalledWith(1, params.id, 'user-1');
      expect(mealsService.delete).toHaveBeenNthCalledWith(2, params.id, 'user-2');
    });
  });
});
