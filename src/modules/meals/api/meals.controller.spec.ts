/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { MealsController } from './meals.controller';
import { MealsService } from '../application/meals.service';
import { MealOutputModel } from './models/output/meal.output.model';
import { AddProductToMealInputModel } from './models/input/add-product-to-meal.input.model';
import { RemoveProductFromMealInputModel } from './models/input/remove-product-from-meal.input.model';
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
            addOrUpdateProduct: jest.fn(),
            removeProduct: jest.fn(),
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
        aiConfidence: undefined,
      });

      jest.spyOn(mealsService, 'getById').mockResolvedValue(mockMeal);

      // Act
      const result = await controller.getMealById(params, user);

      // Assert
      expect(result.time).toBeUndefined();
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

  describe('addOrUpdateProduct', () => {
    it('should successfully add new product to meal', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439011' };
      const user = createMockUser();
      const productData: AddProductToMealInputModel = {
        productId: '507f1f77bcf86cd799439020',
        quantity: 150,
      };
      const newFoodItem = createMockFoodItem({
        productId: productData.productId,
        quantity: productData.quantity,
        kcal: 525, // 350 * 150 / 100
      });
      const updatedMeal = createMockMeal({
        id: params.id,
        items: [newFoodItem],
        totalKcal: 525,
      });

      jest.spyOn(mealsService, 'addOrUpdateProduct').mockResolvedValue(updatedMeal);

      // Act
      const result: MealOutputModel = await controller.addOrUpdateProduct(
        params,
        productData,
        user,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual(updatedMeal);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe(productData.productId);
      expect(result.items[0].quantity).toBe(productData.quantity);
      expect(result.totalKcal).toBe(525);
      expect(mealsService.addOrUpdateProduct).toHaveBeenCalledTimes(1);
      expect(mealsService.addOrUpdateProduct).toHaveBeenCalledWith(
        params.id,
        user.userId,
        productData.productId,
        productData.quantity,
      );
    });

    it('should successfully update existing product quantity in meal', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439011' };
      const user = createMockUser();
      const existingProductId = '507f1f77bcf86cd799439020';
      const productData: AddProductToMealInputModel = {
        productId: existingProductId,
        quantity: 200, // Updated quantity
      };
      const updatedFoodItem = createMockFoodItem({
        productId: existingProductId,
        quantity: 200,
        kcal: 700, // 350 * 200 / 100
      });
      const updatedMeal = createMockMeal({
        id: params.id,
        items: [updatedFoodItem],
        totalKcal: 700,
      });

      jest.spyOn(mealsService, 'addOrUpdateProduct').mockResolvedValue(updatedMeal);

      // Act
      const result = await controller.addOrUpdateProduct(params, productData, user);

      // Assert
      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe(existingProductId);
      expect(result.items[0].quantity).toBe(200);
      expect(result.totalKcal).toBe(700);
      expect(mealsService.addOrUpdateProduct).toHaveBeenCalledWith(
        params.id,
        user.userId,
        productData.productId,
        productData.quantity,
      );
    });

    it('should add product to meal that already has other products', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439011' };
      const user = createMockUser();
      const productData: AddProductToMealInputModel = {
        productId: '507f1f77bcf86cd799439021', // New product
        quantity: 100,
      };
      const existingItem = createMockFoodItem({
        id: '507f1f77bcf86cd799439015',
        productId: '507f1f77bcf86cd799439020',
        kcal: 350,
      });
      const newItem = createMockFoodItem({
        id: '507f1f77bcf86cd799439016',
        productId: productData.productId,
        quantity: productData.quantity,
        kcal: 100,
      });
      const updatedMeal = createMockMeal({
        id: params.id,
        items: [existingItem, newItem],
        totalKcal: 450, // 350 + 100
      });

      jest.spyOn(mealsService, 'addOrUpdateProduct').mockResolvedValue(updatedMeal);

      // Act
      const result = await controller.addOrUpdateProduct(params, productData, user);

      // Assert
      expect(result.items).toHaveLength(2);
      expect(result.totalKcal).toBe(450);
      expect(mealsService.addOrUpdateProduct).toHaveBeenCalledWith(
        params.id,
        user.userId,
        productData.productId,
        productData.quantity,
      );
    });

    it('should throw DomainException with NotFound when meal does not exist', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439099' };
      const user = createMockUser();
      const productData: AddProductToMealInputModel = {
        productId: '507f1f77bcf86cd799439020',
        quantity: 150,
      };
      const notFoundException = new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'meal not found',
      });

      jest.spyOn(mealsService, 'addOrUpdateProduct').mockRejectedValue(notFoundException);

      // Act & Assert
      await expect(controller.addOrUpdateProduct(params, productData, user)).rejects.toThrow(
        DomainException,
      );
      await expect(controller.addOrUpdateProduct(params, productData, user)).rejects.toThrow(
        'meal not found',
      );
      await expect(controller.addOrUpdateProduct(params, productData, user)).rejects.toMatchObject({
        code: DomainExceptionCode.NotFound,
      });

      expect(mealsService.addOrUpdateProduct).toHaveBeenCalledWith(
        params.id,
        user.userId,
        productData.productId,
        productData.quantity,
      );
    });

    it('should throw DomainException with NotFound when product does not exist', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439011' };
      const user = createMockUser();
      const productData: AddProductToMealInputModel = {
        productId: '507f1f77bcf86cd799439099', // Non-existent product
        quantity: 150,
      };
      const notFoundException = new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'product not found',
      });

      jest.spyOn(mealsService, 'addOrUpdateProduct').mockRejectedValue(notFoundException);

      // Act & Assert
      await expect(controller.addOrUpdateProduct(params, productData, user)).rejects.toThrow(
        DomainException,
      );
      await expect(controller.addOrUpdateProduct(params, productData, user)).rejects.toThrow(
        'product not found',
      );
      await expect(controller.addOrUpdateProduct(params, productData, user)).rejects.toMatchObject({
        code: DomainExceptionCode.NotFound,
      });
    });

    it('should throw DomainException with Forbidden when user does not own the meal', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439011' };
      const user = createMockUser({ userId: 'different-user-id' });
      const productData: AddProductToMealInputModel = {
        productId: '507f1f77bcf86cd799439020',
        quantity: 150,
      };
      const forbiddenException = new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'You can only update your own meals',
      });

      jest.spyOn(mealsService, 'addOrUpdateProduct').mockRejectedValue(forbiddenException);

      // Act & Assert
      await expect(controller.addOrUpdateProduct(params, productData, user)).rejects.toThrow(
        DomainException,
      );
      await expect(controller.addOrUpdateProduct(params, productData, user)).rejects.toThrow(
        'You can only update your own meals',
      );
      await expect(controller.addOrUpdateProduct(params, productData, user)).rejects.toMatchObject({
        code: DomainExceptionCode.Forbidden,
      });

      expect(mealsService.addOrUpdateProduct).toHaveBeenCalledWith(
        params.id,
        user.userId,
        productData.productId,
        productData.quantity,
      );
    });

    it('should handle zero quantity (remove product scenario)', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439011' };
      const user = createMockUser();
      const productData: AddProductToMealInputModel = {
        productId: '507f1f77bcf86cd799439020',
        quantity: 0,
      };
      const updatedMeal = createMockMeal({
        id: params.id,
        items: [],
        totalKcal: 0,
      });

      jest.spyOn(mealsService, 'addOrUpdateProduct').mockResolvedValue(updatedMeal);

      // Act
      const result = await controller.addOrUpdateProduct(params, productData, user);

      // Assert
      expect(result.items).toEqual([]);
      expect(result.totalKcal).toBe(0);
      expect(mealsService.addOrUpdateProduct).toHaveBeenCalledWith(
        params.id,
        user.userId,
        productData.productId,
        0,
      );
    });

    it('should recalculate totalKcal when updating product quantity', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439011' };
      const user = createMockUser();
      const productData: AddProductToMealInputModel = {
        productId: '507f1f77bcf86cd799439020',
        quantity: 250,
      };
      const updatedFoodItem = createMockFoodItem({
        productId: productData.productId,
        quantity: 250,
        kcal: 875, // 350 * 250 / 100
      });
      const updatedMeal = createMockMeal({
        id: params.id,
        items: [updatedFoodItem],
        totalKcal: 875,
      });

      jest.spyOn(mealsService, 'addOrUpdateProduct').mockResolvedValue(updatedMeal);

      // Act
      const result = await controller.addOrUpdateProduct(params, productData, user);

      // Assert
      expect(result.totalKcal).toBe(875);
      expect(result.items[0].kcal).toBe(875);
    });
  });

  describe('removeProduct', () => {
    it('should successfully remove product from meal', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439011' };
      const user = createMockUser();
      const productData: RemoveProductFromMealInputModel = {
        productId: '507f1f77bcf86cd799439020',
      };
      const updatedMeal = createMockMeal({
        id: params.id,
        items: [],
        totalKcal: 0,
      });

      jest.spyOn(mealsService, 'removeProduct').mockResolvedValue(updatedMeal);

      // Act
      const result: MealOutputModel = await controller.removeProduct(params, productData, user);

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual(updatedMeal);
      expect(result.items).toHaveLength(0);
      expect(result.totalKcal).toBe(0);
      expect(mealsService.removeProduct).toHaveBeenCalledTimes(1);
      expect(mealsService.removeProduct).toHaveBeenCalledWith(
        params.id,
        user.userId,
        productData.productId,
      );
    });

    it('should remove product and keep other products in meal', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439011' };
      const user = createMockUser();
      const productData: RemoveProductFromMealInputModel = {
        productId: '507f1f77bcf86cd799439020',
      };
      const remainingItem = createMockFoodItem({
        id: '507f1f77bcf86cd799439016',
        productId: '507f1f77bcf86cd799439021',
        name: 'Банан',
        kcal: 100,
      });
      const updatedMeal = createMockMeal({
        id: params.id,
        items: [remainingItem],
        totalKcal: 100,
      });

      jest.spyOn(mealsService, 'removeProduct').mockResolvedValue(updatedMeal);

      // Act
      const result = await controller.removeProduct(params, productData, user);

      // Assert
      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe('507f1f77bcf86cd799439021');
      expect(result.totalKcal).toBe(100);
      expect(mealsService.removeProduct).toHaveBeenCalledWith(
        params.id,
        user.userId,
        productData.productId,
      );
    });

    it('should recalculate totalKcal after removing product', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439011' };
      const user = createMockUser();
      const productData: RemoveProductFromMealInputModel = {
        productId: '507f1f77bcf86cd799439020',
      };
      const item1 = createMockFoodItem({
        id: '507f1f77bcf86cd799439016',
        productId: '507f1f77bcf86cd799439021',
        kcal: 200,
      });
      const item2 = createMockFoodItem({
        id: '507f1f77bcf86cd799439017',
        productId: '507f1f77bcf86cd799439022',
        kcal: 150,
      });
      const updatedMeal = createMockMeal({
        id: params.id,
        items: [item1, item2],
        totalKcal: 350,
      });

      jest.spyOn(mealsService, 'removeProduct').mockResolvedValue(updatedMeal);

      // Act
      const result = await controller.removeProduct(params, productData, user);

      // Assert
      expect(result.items).toHaveLength(2);
      expect(result.totalKcal).toBe(350);
    });

    it('should throw DomainException with NotFound when meal does not exist', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439099' };
      const user = createMockUser();
      const productData: RemoveProductFromMealInputModel = {
        productId: '507f1f77bcf86cd799439020',
      };
      const notFoundException = new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'meal not found',
      });

      jest.spyOn(mealsService, 'removeProduct').mockRejectedValue(notFoundException);

      // Act & Assert
      await expect(controller.removeProduct(params, productData, user)).rejects.toThrow(
        DomainException,
      );
      await expect(controller.removeProduct(params, productData, user)).rejects.toThrow(
        'meal not found',
      );
      await expect(controller.removeProduct(params, productData, user)).rejects.toMatchObject({
        code: DomainExceptionCode.NotFound,
      });

      expect(mealsService.removeProduct).toHaveBeenCalledWith(
        params.id,
        user.userId,
        productData.productId,
      );
    });

    it('should throw DomainException with NotFound when product not found in meal', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439011' };
      const user = createMockUser();
      const productData: RemoveProductFromMealInputModel = {
        productId: '507f1f77bcf86cd799439099', // Product not in meal
      };
      const notFoundException = new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'product not found in meal',
      });

      jest.spyOn(mealsService, 'removeProduct').mockRejectedValue(notFoundException);

      // Act & Assert
      await expect(controller.removeProduct(params, productData, user)).rejects.toThrow(
        DomainException,
      );
      await expect(controller.removeProduct(params, productData, user)).rejects.toThrow(
        'product not found in meal',
      );
      await expect(controller.removeProduct(params, productData, user)).rejects.toMatchObject({
        code: DomainExceptionCode.NotFound,
      });
    });

    it('should throw DomainException with Forbidden when user does not own the meal', async () => {
      // Arrange
      const params: GetMealByIdParams = { id: '507f1f77bcf86cd799439011' };
      const user = createMockUser({ userId: 'different-user-id' });
      const productData: RemoveProductFromMealInputModel = {
        productId: '507f1f77bcf86cd799439020',
      };
      const forbiddenException = new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'You can only update your own meals',
      });

      jest.spyOn(mealsService, 'removeProduct').mockRejectedValue(forbiddenException);

      // Act & Assert
      await expect(controller.removeProduct(params, productData, user)).rejects.toThrow(
        DomainException,
      );
      await expect(controller.removeProduct(params, productData, user)).rejects.toThrow(
        'You can only update your own meals',
      );
      await expect(controller.removeProduct(params, productData, user)).rejects.toMatchObject({
        code: DomainExceptionCode.Forbidden,
      });

      expect(mealsService.removeProduct).toHaveBeenCalledWith(
        params.id,
        user.userId,
        productData.productId,
      );
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
