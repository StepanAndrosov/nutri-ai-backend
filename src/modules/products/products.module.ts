import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './domain/product.entity';
import { ProductsController } from './api/products.controller';
import { ProductsService } from './application/products.service';
import { ProductsRepository } from './infrastructure/products.repository';
import { ProductsQueryRepository } from './infrastructure/products.query-repository';

/**
 * Products module for managing food products
 */
@Module({
  imports: [MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }])],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsRepository, ProductsQueryRepository],
  exports: [ProductsService, ProductsRepository, ProductsQueryRepository, MongooseModule],
})
export class ProductsModule {}
