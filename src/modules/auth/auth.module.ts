import { Module, forwardRef } from '@nestjs/common';
import { AuthController } from './api/auth.controller';
import { AuthService } from './application/auth.service';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';

@Module({
  imports: [forwardRef(() => UserAccountsModule)],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
