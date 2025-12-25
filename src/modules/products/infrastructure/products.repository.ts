import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductModelType } from '../domain/product.entity';

/**
 * Repository for product write operations
 */
@Injectable()
export class ProductsRepository {
  constructor(@InjectModel(Product.name) private ProductModel: ProductModelType) {}

  /**
   * Create a new product
   * @param newProduct - Product data to create
   * @returns Created product ID
   */
  async create(newProduct: Product): Promise<string> {
    const insertResult = await this.ProductModel.insertMany([newProduct]);
    return insertResult[0].id as string;
  }

  /**
   * Update an existing product
   * @param id - Product ID
   * @param updateData - Partial product data to update
   * @returns True if product was updated, false otherwise
   */
  async update(id: string, updateData: Partial<Product>): Promise<boolean> {
    const result = await this.ProductModel.updateOne(
      { _id: id },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      },
    );
    return result.modifiedCount === 1;
  }

  /**
   * Delete a product
   * @param id - Product ID
   * @returns True if product was deleted, false otherwise
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.ProductModel.deleteOne({ _id: id });
    return result.deletedCount === 1;
  }

  /**
   * Increment the usage count of a product
   * Used when a product is added to a meal
   * @param id - Product ID
   */
  async incrementUsageCount(id: string): Promise<void> {
    await this.ProductModel.updateOne(
      { _id: id },
      {
        $inc: {
          usageCount: 1,
        },
      },
    );
  }
}
