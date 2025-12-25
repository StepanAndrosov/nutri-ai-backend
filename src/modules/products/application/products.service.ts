import { Injectable } from '@nestjs/common';
import { ProductsRepository } from '../infrastructure/products.repository';
import { ProductsQueryRepository } from '../infrastructure/products.query-repository';
import { normalizeProductName } from '../../../common/utils/transliteration.util';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';
import { ProductSource } from '../domain/product.entity';

/**
 * Interface for creating a product
 */
export interface CreateProductData {
  name: string;
  kcalPer100g: number;
  proteinPer100g?: number;
  fatPer100g?: number;
  carbsPer100g?: number;
  fiberPer100g?: number;
  sugarPer100g?: number;
  barcode?: string;
  brand?: string;
  category?: string;
  source?: ProductSource;
}

/**
 * Interface for updating a product
 */
export interface UpdateProductData {
  name?: string;
  kcalPer100g?: number;
  proteinPer100g?: number;
  fatPer100g?: number;
  carbsPer100g?: number;
  fiberPer100g?: number;
  sugarPer100g?: number;
  barcode?: string;
  brand?: string;
  category?: string;
}

/**
 * Service for products business logic
 */
@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly productsQueryRepository: ProductsQueryRepository,
  ) {}

  /**
   * Create a new product
   * @param data - Product creation data
   * @param userId - ID of the user creating the product
   * @returns Created product ID
   */
  async create(data: CreateProductData, userId: string): Promise<string> {
    const newProduct = {
      name: data.name,
      normalizedName: normalizeProductName(data.name),
      kcalPer100g: data.kcalPer100g,
      proteinPer100g: data.proteinPer100g,
      fatPer100g: data.fatPer100g,
      carbsPer100g: data.carbsPer100g,
      fiberPer100g: data.fiberPer100g,
      sugarPer100g: data.sugarPer100g,
      barcode: data.barcode,
      brand: data.brand,
      category: data.category,
      source: data.source === ProductSource.MANUAL ? ProductSource.MANUAL : ProductSource.USER,
      createdBy: userId,
      isVerified: false,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return await this.productsRepository.create(newProduct);
  }

  /**
   * Update an existing product
   * @param id - Product ID
   * @param data - Product update data
   * @param userId - ID of the user performing the update
   * @throws DomainException with Forbidden code if user doesn't own the product
   * @throws DomainException with NotFound code if product doesn't exist
   */
  async update(id: string, data: UpdateProductData, userId: string): Promise<void> {
    // Check ownership
    const isOwner = await this.productsQueryRepository.checkOwnership(id, userId);
    if (!isOwner) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'You can only update products you created',
      });
    }

    const updateData: Partial<{
      name: string;
      normalizedName: string;
      kcalPer100g: number;
      proteinPer100g: number;
      fatPer100g: number;
      carbsPer100g: number;
      fiberPer100g: number;
      sugarPer100g: number;
      barcode: string;
      brand: string;
      category: string;
    }> = { ...data };

    // Regenerate normalized name if name was changed
    if (data.name) {
      updateData.normalizedName = normalizeProductName(data.name);
    }

    const updated = await this.productsRepository.update(id, updateData);
    if (!updated) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'product not found',
      });
    }
  }

  /**
   * Delete a product
   * @param id - Product ID
   * @param userId - ID of the user performing the deletion
   * @throws DomainException with Forbidden code if user doesn't own the product
   * @throws DomainException with NotFound code if product doesn't exist
   */
  async delete(id: string, userId: string): Promise<void> {
    // Check ownership
    const isOwner = await this.productsQueryRepository.checkOwnership(id, userId);
    if (!isOwner) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'You can only delete products you created',
      });
    }

    const deleted = await this.productsRepository.delete(id);
    if (!deleted) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'product not found',
      });
    }
  }
}
