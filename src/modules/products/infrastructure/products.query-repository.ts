import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery } from 'mongoose';
import { Product, ProductModelType, ProductSource } from '../domain/product.entity';
import {
  ProductOutputModel,
  ProductOutputModelMapper,
} from '../api/models/output/product.output.model';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

/**
 * Filters for querying products
 */
export interface ProductFilters {
  search?: string;
  category?: string;
  source?: ProductSource;
  limit: number;
  offset: number;
}

/**
 * Repository for product read operations
 */
@Injectable()
export class ProductsQueryRepository {
  constructor(@InjectModel(Product.name) private ProductModel: ProductModelType) {}

  /**
   * Get product by ID
   * @param id - Product ID
   * @returns Product output model or null if not found
   */
  async getById(id: string): Promise<ProductOutputModel | null> {
    const product = await this.ProductModel.findOne({ _id: id });
    if (!product) return null;
    return ProductOutputModelMapper(product);
  }

  /**
   * Get product by ID or throw exception if not found
   * @param id - Product ID
   * @returns Product output model
   * @throws DomainException with NotFound code if product doesn't exist
   */
  async getByIdOrNotFoundFail(id: string): Promise<ProductOutputModel> {
    const product = await this.ProductModel.findOne({ _id: id });
    if (!product) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'product not found',
      });
    }
    return ProductOutputModelMapper(product);
  }

  /**
   * Get product by barcode
   * @param barcode - Product barcode
   * @returns Product output model or null if not found
   */
  async getByBarcode(barcode: string): Promise<ProductOutputModel | null> {
    const product = await this.ProductModel.findOne({ barcode });
    if (!product) return null;
    return ProductOutputModelMapper(product);
  }

  /**
   * Get product by barcode or throw exception if not found
   * @param barcode - Product barcode
   * @returns Product output model
   * @throws DomainException with NotFound code if product doesn't exist
   */
  async getByBarcodeOrNotFoundFail(barcode: string): Promise<ProductOutputModel> {
    const product = await this.ProductModel.findOne({ barcode });
    if (!product) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'product not found',
      });
    }
    return ProductOutputModelMapper(product);
  }

  /**
   * Get all products with filtering and pagination
   * @param filters - Search, category, source filters and pagination params
   * @returns Object with products array and total count
   */
  async getAll(
    filters: ProductFilters,
  ): Promise<{ products: ProductOutputModel[]; total: number }> {
    const query: FilterQuery<Product> = {};

    if (filters.search) {
      query.normalizedName = { $regex: filters.search.toLowerCase(), $options: 'i' };
    }
    if (filters.category) {
      query.category = filters.category;
    }
    if (filters.source) {
      query.source = filters.source;
    }

    const [products, total] = await Promise.all([
      this.ProductModel.find(query)
        .sort({ createdAt: -1 })
        .skip(filters.offset)
        .limit(filters.limit),
      this.ProductModel.countDocuments(query),
    ]);

    return {
      products: products.map(ProductOutputModelMapper),
      total,
    };
  }

  /**
   * Search products by name (autocomplete)
   * @param searchTerm - Search term to match against normalized name
   * @param limit - Maximum number of results
   * @returns Array of matching products sorted by usage count
   */
  async search(searchTerm: string, limit: number): Promise<ProductOutputModel[]> {
    const normalizedSearch = searchTerm.toLowerCase();

    const products = await this.ProductModel.find({
      normalizedName: { $regex: `^${normalizedSearch}`, $options: 'i' },
    })
      .sort({ usageCount: -1, createdAt: -1 })
      .limit(limit);

    return products.map(ProductOutputModelMapper);
  }

  /**
   * Check if a user owns a product
   * @param productId - Product ID
   * @param userId - User ID
   * @returns True if user created the product, false otherwise
   */
  async checkOwnership(productId: string, userId: string): Promise<boolean> {
    const product = await this.ProductModel.findOne({ _id: productId });
    return product?.createdBy === userId;
  }
}
