import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/api/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/api/guards/roles.guard';
import { Roles } from '../../auth/api/decorators/roles.decorator';
import { CurrentUser } from '../../auth/api/decorators/current-user.decorator';
import { CurrentUserType } from '../../auth/api/types/request-with-user.type';
import { UserRole } from '../../auth/domain/user-role.enum';
import { SubscriptionsService } from '../application/subscriptions.service';
import { SubscriptionOutputModel } from './models/output/subscription.output.model';
import { UpdateSubscriptionInputModel } from './models/input/update-subscription.input.model';
import { SubscriptionStatus } from '../domain/subscription-status.enum';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user subscription' })
  async getMy(@CurrentUser() user: CurrentUserType): Promise<SubscriptionOutputModel> {
    const subscription = await this.subscriptionsService.getByUserId(user.userId);

    if (!subscription) {
      return {
        id: '',
        userId: user.userId,
        status: SubscriptionStatus.NONE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return subscription;
  }

  @Patch(':userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user subscription (Admin only)' })
  async updateSubscription(
    @Param('userId') userId: string,
    @Body() body: UpdateSubscriptionInputModel,
  ): Promise<SubscriptionOutputModel> {
    await this.subscriptionsService.updateSubscription(
      userId,
      body.status,
      body.plan,
      body.expiresAt,
    );

    const subscription = await this.subscriptionsService.getByUserId(userId);

    return (
      subscription ?? {
        id: '',
        userId,
        status: body.status,
        plan: body.plan,
        expiresAt: body.expiresAt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );
  }
}
