import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { MealsRepository } from '../infrastructure/meals.repository';
import { MealsQueryRepository } from '../infrastructure/meals.query-repository';
import { DaysService } from '../../days/application/days.service';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';
import { MealType, MealSource } from '../domain/meal.entity';
import { FoodItem } from '../domain/food-item.subdocument';
import { MealOutputModel } from '../api/models/output/meal.output.model';
import { ProductsQueryRepository } from '../../products/infrastructure/products.query-repository';
import { CreateMealItemInputModel } from '../api/models/input/create-meal-item.input.model';

/**
 * Interface for creating a meal
 */
export interface CreateMealData {
  type: MealType;
  time?: string;
  items: CreateMealItemInputModel[];
  source: MealSource;
  aiConfidence?: number;
}

/**
 * Interface for updating a meal
 */
export interface UpdateMealData {
  type?: MealType;
  time?: string;
  items?: FoodItem[];
  totalKcal?: number;
  source?: MealSource;
  aiConfidence?: number;
}

/**
 * Service for meals business logic
 */
@Injectable()
export class MealsService {
  constructor(
    private readonly mealsRepository: MealsRepository,
    private readonly mealsQueryRepository: MealsQueryRepository,
    @Inject(forwardRef(() => DaysService))
    private readonly daysService: DaysService,
    private readonly productsQueryRepository: ProductsQueryRepository,
  ) {}

  /**
   * Create a new meal for a specific date
   * Creates day entry if it doesn't exist
   * Processes meal items (products/recipes) and calculates nutrition automatically
   * @param userId - User ID
   * @param date - Date in YYYY-MM-DD format
   * @param data - Meal creation data
   * @returns Created meal output model
   */
  async createMealForDate(
    userId: string,
    date: string,
    data: CreateMealData,
  ): Promise<MealOutputModel> {
    // Get or create day entry for this date
    const dayEntry = await this.daysService.getOrCreate(userId, date);

    // Check if a meal with this type already exists for this day
    const mealTypeExists = await this.mealsQueryRepository.checkMealTypeExistsForDayEntry(
      dayEntry.id,
      data.type,
    );

    if (mealTypeExists) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: `meal with type '${data.type}' already exists for this day`,
      });
    }

    // Process meal items and create FoodItems with calculated nutrition
    const foodItems: FoodItem[] = [];

    for (const item of data.items) {
      if (item.productId) {
        // Get product details
        const product = await this.productsQueryRepository.getByIdOrNotFoundFail(item.productId);

        // Calculate nutrition values based on quantity
        const kcal = Math.round((product.kcalPer100g * item.quantity) / 100);
        const protein = product.proteinPer100g
          ? Math.round(((product.proteinPer100g * item.quantity) / 100) * 10) / 10
          : undefined;
        const fat = product.fatPer100g
          ? Math.round(((product.fatPer100g * item.quantity) / 100) * 10) / 10
          : undefined;
        const carbs = product.carbsPer100g
          ? Math.round(((product.carbsPer100g * item.quantity) / 100) * 10) / 10
          : undefined;

        // Create FoodItem
        const foodItem: FoodItem = {
          productId: item.productId,
          name: product.name,
          quantity: item.quantity,
          unit: 'g',
          kcal,
          protein,
          fat,
          carbs,
          source: product.source,
        };

        foodItems.push(foodItem);
      } else if (item.recipeId) {
        // Recipe support will be implemented later
        throw new DomainException({
          code: DomainExceptionCode.BadRequest,
          message: 'Recipe support is not implemented yet',
        });
      } else {
        throw new DomainException({
          code: DomainExceptionCode.BadRequest,
          message: 'Either productId or recipeId must be provided',
        });
      }
    }

    // Calculate total calories
    const totalKcal = foodItems.reduce((sum, item) => sum + item.kcal, 0);

    // Create meal
    const newMeal = {
      dayEntryId: dayEntry.id,
      type: data.type,
      time: data.time,
      items: foodItems,
      totalKcal,
      source: data.source,
      aiConfidence: data.aiConfidence,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mealId = await this.mealsRepository.create(newMeal);

    // Update day entry consumed calories
    await this.updateDayEntryConsumedKcal(dayEntry.id);

    // Return created meal
    const createdMeal = await this.mealsQueryRepository.getByIdOrNotFoundFail(mealId);
    return createdMeal;
  }

  /**
   * Get meal by ID
   * @param id - Meal ID
   * @param userId - User ID (for ownership check)
   * @returns Meal output model
   * @throws DomainException with NotFound code if meal doesn't exist
   * @throws DomainException with Forbidden code if user doesn't own the meal
   */
  async getById(id: string, userId: string): Promise<MealOutputModel> {
    const meal = await this.mealsQueryRepository.getByIdOrNotFoundFail(id);

    // Check ownership through day entry
    const isOwner = await this.daysService.checkOwnership(meal.dayEntryId, userId);
    if (!isOwner) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'You can only access your own meals',
      });
    }

    return meal;
  }

  /**
   * Update product quantity in meal
   * Finds existing product in meal items and updates its quantity
   * Recalculates nutrition values based on new quantity
   * @param id - Meal ID
   * @param userId - User ID (for ownership check)
   * @param productId - Product ID to update
   * @param quantity - New quantity in grams
   * @returns Updated meal output model
   * @throws DomainException with NotFound code if meal doesn't exist or product not found in meal
   * @throws DomainException with Forbidden code if user doesn't own the meal
   */
  async updateProduct(
    id: string,
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<MealOutputModel> {
    // Check meal exists and get it
    const existingMeal = await this.mealsQueryRepository.getByIdOrNotFoundFail(id);

    // Check ownership through day entry
    const isOwner = await this.daysService.checkOwnership(existingMeal.dayEntryId, userId);
    if (!isOwner) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'You can only update your own meals',
      });
    }

    // Find existing item with this productId
    const existingItemIndex = existingMeal.items.findIndex((item) => item.productId === productId);

    if (existingItemIndex === -1) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'product not found in meal',
      });
    }

    const existingItem = existingMeal.items[existingItemIndex];

    // Calculate values per 100g from existing item data
    const kcalPer100g = (existingItem.kcal / existingItem.quantity) * 100;
    const proteinPer100g = existingItem.protein
      ? (existingItem.protein / existingItem.quantity) * 100
      : undefined;
    const fatPer100g = existingItem.fat
      ? (existingItem.fat / existingItem.quantity) * 100
      : undefined;
    const carbsPer100g = existingItem.carbs
      ? (existingItem.carbs / existingItem.quantity) * 100
      : undefined;

    // Recalculate nutrition values based on new quantity
    const kcal = Math.round((kcalPer100g * quantity) / 100);
    const protein = proteinPer100g
      ? Math.round(((proteinPer100g * quantity) / 100) * 10) / 10
      : undefined;
    const fat = fatPer100g ? Math.round(((fatPer100g * quantity) / 100) * 10) / 10 : undefined;
    const carbs = carbsPer100g
      ? Math.round(((carbsPer100g * quantity) / 100) * 10) / 10
      : undefined;

    // Update item with new quantity and recalculated nutrition
    const updatedItems = [...existingMeal.items];
    updatedItems[existingItemIndex] = {
      ...existingItem,
      quantity,
      kcal,
      protein,
      fat,
      carbs,
    };

    // Recalculate total calories
    const totalKcal = updatedItems.reduce((sum, item) => sum + item.kcal, 0);

    // Update meal in database
    const updated = await this.mealsRepository.update(id, {
      items: updatedItems,
      totalKcal,
    });

    if (!updated) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'meal not found',
      });
    }

    // Update day entry consumed calories
    await this.updateDayEntryConsumedKcal(existingMeal.dayEntryId);

    // Return updated meal
    const updatedMeal = await this.mealsQueryRepository.getByIdOrNotFoundFail(id);
    return updatedMeal;
  }

  /**
   * Update meal items array
   * Replaces entire items array with new items based on productId and quantity
   * Finds each product in existing meal items and recalculates nutrition based on new quantity
   * @param id - Meal ID
   * @param userId - User ID (for ownership check)
   * @param items - Array of { productId, quantity } to update
   * @returns Updated meal output model
   * @throws DomainException with NotFound code if meal doesn't exist or any product not found in meal
   * @throws DomainException with Forbidden code if user doesn't own the meal
   */
  async updateMealItems(
    id: string,
    userId: string,
    items: Array<{ productId: string; quantity: number }>,
  ): Promise<MealOutputModel> {
    // Check meal exists and get it
    const existingMeal = await this.mealsQueryRepository.getByIdOrNotFoundFail(id);

    // Check ownership through day entry
    const isOwner = await this.daysService.checkOwnership(existingMeal.dayEntryId, userId);
    if (!isOwner) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'You can only update your own meals',
      });
    }

    // Build new items array by finding and updating each product
    const updatedItems: FoodItem[] = [];

    for (const item of items) {
      // Find existing item with this productId
      const existingItem = existingMeal.items.find((i) => i.productId === item.productId);

      if (!existingItem) {
        throw new DomainException({
          code: DomainExceptionCode.NotFound,
          message: `product with id '${item.productId}' not found in meal`,
        });
      }

      // Calculate values per 100g from existing item data
      const kcalPer100g = (existingItem.kcal / existingItem.quantity) * 100;
      const proteinPer100g = existingItem.protein
        ? (existingItem.protein / existingItem.quantity) * 100
        : undefined;
      const fatPer100g = existingItem.fat
        ? (existingItem.fat / existingItem.quantity) * 100
        : undefined;
      const carbsPer100g = existingItem.carbs
        ? (existingItem.carbs / existingItem.quantity) * 100
        : undefined;

      // Recalculate nutrition values based on new quantity
      const kcal = Math.round((kcalPer100g * item.quantity) / 100);
      const protein = proteinPer100g
        ? Math.round(((proteinPer100g * item.quantity) / 100) * 10) / 10
        : undefined;
      const fat = fatPer100g
        ? Math.round(((fatPer100g * item.quantity) / 100) * 10) / 10
        : undefined;
      const carbs = carbsPer100g
        ? Math.round(((carbsPer100g * item.quantity) / 100) * 10) / 10
        : undefined;

      // Create updated FoodItem
      updatedItems.push({
        ...existingItem,
        quantity: item.quantity,
        kcal,
        protein,
        fat,
        carbs,
      });
    }

    // Recalculate total calories
    const totalKcal = updatedItems.reduce((sum, item) => sum + item.kcal, 0);

    // Update meal in database
    const updated = await this.mealsRepository.update(id, {
      items: updatedItems,
      totalKcal,
    });

    if (!updated) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'meal not found',
      });
    }

    // Update day entry consumed calories
    await this.updateDayEntryConsumedKcal(existingMeal.dayEntryId);

    // Return updated meal
    const updatedMeal = await this.mealsQueryRepository.getByIdOrNotFoundFail(id);
    return updatedMeal;
  }

  /**
   * Remove product from meal
   * Finds and removes the product from items array
   * Recalculates totalKcal automatically
   * If no items remain after removal, deletes the entire meal
   * @param id - Meal ID
   * @param userId - User ID (for ownership check)
   * @param productId - Product ID to remove
   * @returns Updated meal output model, or null if meal was deleted
   * @throws DomainException with NotFound code if meal doesn't exist or product not found in meal
   * @throws DomainException with Forbidden code if user doesn't own the meal
   */
  async removeProduct(
    id: string,
    userId: string,
    productId: string,
  ): Promise<MealOutputModel | null> {
    // Check meal exists and get it
    const existingMeal = await this.mealsQueryRepository.getByIdOrNotFoundFail(id);

    // Check ownership through day entry
    const isOwner = await this.daysService.checkOwnership(existingMeal.dayEntryId, userId);
    if (!isOwner) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'You can only update your own meals',
      });
    }

    // Find existing item with this productId
    const existingItemIndex = existingMeal.items.findIndex((item) => item.productId === productId);

    if (existingItemIndex === -1) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'product not found in meal',
      });
    }

    // Remove product from items array
    const updatedItems = existingMeal.items.filter((item) => item.productId !== productId);

    // If no items remain, delete the entire meal
    if (updatedItems.length === 0) {
      const deleted = await this.mealsRepository.delete(id);
      if (!deleted) {
        throw new DomainException({
          code: DomainExceptionCode.NotFound,
          message: 'meal not found',
        });
      }

      // Update day entry consumed calories
      await this.updateDayEntryConsumedKcal(existingMeal.dayEntryId);

      return null;
    }

    // Recalculate total calories
    const totalKcal = updatedItems.reduce((sum, item) => sum + item.kcal, 0);

    // Update meal in database
    const updated = await this.mealsRepository.update(id, {
      items: updatedItems,
      totalKcal,
    });

    if (!updated) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'meal not found',
      });
    }

    // Update day entry consumed calories
    await this.updateDayEntryConsumedKcal(existingMeal.dayEntryId);

    // Return updated meal
    const updatedMeal = await this.mealsQueryRepository.getByIdOrNotFoundFail(id);
    return updatedMeal;
  }

  /**
   * Delete a meal
   * @param id - Meal ID
   * @param userId - User ID (for ownership check)
   * @throws DomainException with NotFound code if meal doesn't exist
   * @throws DomainException with Forbidden code if user doesn't own the meal
   */
  async delete(id: string, userId: string): Promise<void> {
    // Check meal exists and get day entry ID
    const existingMeal = await this.mealsQueryRepository.getByIdOrNotFoundFail(id);

    // Check ownership through day entry
    const isOwner = await this.daysService.checkOwnership(existingMeal.dayEntryId, userId);
    if (!isOwner) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'You can only delete your own meals',
      });
    }

    // Delete meal
    const deleted = await this.mealsRepository.delete(id);
    if (!deleted) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'meal not found',
      });
    }

    // Update day entry consumed calories
    await this.updateDayEntryConsumedKcal(existingMeal.dayEntryId);
  }

  /**
   * Update day entry consumed calories by recalculating from all meals
   * @param dayEntryId - Day entry ID
   */
  private async updateDayEntryConsumedKcal(dayEntryId: string): Promise<void> {
    const totalKcal = await this.mealsQueryRepository.calculateTotalKcalForDayEntry(dayEntryId);
    await this.daysService.updateConsumedKcal(dayEntryId, totalKcal);
  }
}
