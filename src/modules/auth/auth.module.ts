import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './api/auth.controller';
import { AuthService } from './application/auth.service';
import { JwtStrategy } from './application/strategies/jwt.strategy';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { appSettings } from '../../setup/app-settings';

@Module({
  imports: [
    forwardRef(() => UserAccountsModule),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: appSettings.api.JWT_SECRET,
      signOptions: {
        expiresIn: appSettings.api.JWT_EXPIRES_IN as `7d`, // '7d', // 7 days
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, PassportModule, JwtModule],
})
export class AuthModule {}
