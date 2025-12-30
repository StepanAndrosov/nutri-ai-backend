import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CoreModule } from './core/core.module';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
import { AuthModule } from './modules/auth/auth.module';
import { FoodDatabaseModule } from './modules/food-database/food-database.module';
import { ProductsModule } from './modules/products/products.module';
import { DaysModule } from './modules/days/days.module';
import { MealsModule } from './modules/meals/meals.module';
import { AiModule } from './modules/ai/ai.module';
import {
  appConfig,
  databaseConfig,
  jwtConfig,
  googleConfig,
  foodApiConfig,
  openaiConfig,
  validate,
} from './config';

@Module({
  imports: [
    CoreModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, googleConfig, foodApiConfig, openaiConfig],
      validate,
      cache: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.mongoUri'),
      }),
      inject: [ConfigService],
    }),
    UserAccountsModule,
    AuthModule,
    FoodDatabaseModule,
    ProductsModule,
    DaysModule,
    MealsModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
