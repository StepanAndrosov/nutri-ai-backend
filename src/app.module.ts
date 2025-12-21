import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { appSettings } from './setup/app-settings';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
import { AuthModule } from './modules/auth/auth.module';
import { FoodDatabaseModule } from './modules/food-database/food-database.module';

@Module({
  imports: [
    MongooseModule.forRoot(appSettings.api.MONGO_CONNECTION_URI),
    UserAccountsModule,
    AuthModule,
    FoodDatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
