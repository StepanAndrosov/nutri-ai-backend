import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProductsService } from '../application/products.service';
import { ProductsQueryRepository } from '../infrastructure/products.query-repository';
import { JwtAuthGuard } from '../../auth/api/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/api/decorators/current-user.decorator';
import { CurrentUserType } from '../../auth/api/types/request-with-user.type';
import { CreateProductInputModel } from './models/input/create-product.input.model';
import { UpdateProductInputModel } from './models/input/update-product.input.model';
import { GetProductsQueryParams } from './input-dto/get-products-query-params.input-dto';
import { ProductOutputModel } from './models/output/product.output.model';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

/**
 * Query parameters for search endpoint
 */
class SearchQueryParams {
  @IsOptional()
  q?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}

/**
 * Controller for products management
 */
@ApiTags('Products')
@Controller('products')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly productsQueryRepository: ProductsQueryRepository,
  ) {}

  /**
   * Get list of products with filtering and pagination
   */
  @Get()
  @ApiOperation({ summary: 'Get list of products with filters' })
  @ApiResponse({
    status: 200,
    description: 'Products list with pagination',
    schema: {
      type: 'object',
      properties: {
        products: {
          type: 'array',
          items: { $ref: '#/components/schemas/ProductOutputModel' },
        },
        total: { type: 'number', example: 100 },
      },
    },
  })
  async getAll(@Query() query: GetProductsQueryParams) {
    return this.productsQueryRepository.getAll({
      search: query.search,
      category: query.category,
      source: query.source,
      limit: query.limit,
      offset: query.offset,
    });
  }

  /**
   * Create a new product
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new product' })
  @ApiResponse({
    status: 201,
    description: 'Product created',
    type: ProductOutputModel,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  async create(
    @Body() createData: CreateProductInputModel,
    @CurrentUser() user: CurrentUserType,
  ): Promise<ProductOutputModel> {
    const productId = await this.productsService.create(createData, user.userId);
    return this.productsQueryRepository.getByIdOrNotFoundFail(productId);
  }

  /**
   * Autocomplete search for products
   */
  @Get('search')
  @ApiOperation({ summary: 'Autocomplete search for products' })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    schema: {
      type: 'object',
      properties: {
        products: {
          type: 'array',
          items: { $ref: '#/components/schemas/ProductOutputModel' },
        },
      },
    },
  })
  async search(@Query() queryParams: SearchQueryParams) {
    const products = await this.productsQueryRepository.search(
      queryParams.q || '',
      queryParams.limit || 10,
    );
    return { products };
  }

  /**
   * Get product by barcode
   */
  @Get('barcode/:barcode')
  @ApiOperation({ summary: 'Get product by barcode' })
  @ApiResponse({
    status: 200,
    description: 'Product found',
    type: ProductOutputModel,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getByBarcode(@Param('barcode') barcode: string): Promise<ProductOutputModel> {
    return this.productsQueryRepository.getByBarcodeOrNotFoundFail(barcode);
  }

  /**
   * Get product by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({
    status: 200,
    description: 'Product details',
    type: ProductOutputModel,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getById(@Param('id') id: string): Promise<ProductOutputModel> {
    return this.productsQueryRepository.getByIdOrNotFoundFail(id);
  }

  /**
   * Update a product
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({
    status: 200,
    description: 'Product updated',
    type: ProductOutputModel,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the creator' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async update(
    @Param('id') id: string,
    @Body() updateData: UpdateProductInputModel,
    @CurrentUser() user: CurrentUserType,
  ): Promise<ProductOutputModel> {
    await this.productsService.update(id, updateData, user.userId);
    return this.productsQueryRepository.getByIdOrNotFoundFail(id);
  }

  /**
   * Delete a product
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete product' })
  @ApiResponse({ status: 204, description: 'Product deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the creator' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async delete(@Param('id') id: string, @CurrentUser() user: CurrentUserType): Promise<void> {
    await this.productsService.delete(id, user.userId);
  }
}
