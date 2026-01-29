import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './api/auth.controller';
import { AuthService } from './application/auth.service';
import { JwtStrategy } from './application/strategies/jwt.strategy';
import { RolesGuard } from './api/guards/roles.guard';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';

@Module({
  imports: [
    forwardRef(() => UserAccountsModule),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') || 'your-secret-key-change-in-production',
        signOptions: {
          expiresIn: (configService.get<string>('jwt.expiresIn') || '7d') as `${number}d`,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard],
  exports: [AuthService, JwtStrategy, PassportModule, JwtModule, RolesGuard],
})
export class AuthModule {}
