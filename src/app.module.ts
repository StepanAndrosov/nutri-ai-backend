import { Module, Provider } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersRepository } from './modules/user-accounts/infrastructure/users.repository';
import { UsersService } from './modules/user-accounts/application/users.service';
import { UsersQueryRepository } from './modules/user-accounts/infrastructure/users.query-repository';
import { UsersController } from './modules/user-accounts/api/users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { appSettings } from './setup/app-settings';
import { User, UserSchema } from './modules/user-accounts/domain/user.entity';
import { AuthService } from './modules/auth/application/auth.service';

const usersProviders: Provider[] = [UsersRepository, UsersService, UsersQueryRepository];

@Module({
  imports: [
    MongooseModule.forRoot(appSettings.api.MONGO_CONNECTION_URI),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController, AppController],
  providers: [...usersProviders, AuthService, AppService],
})
export class AppModule {}
