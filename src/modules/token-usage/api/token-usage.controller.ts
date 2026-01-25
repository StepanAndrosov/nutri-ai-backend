import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TokenUsageService } from '../application/token-usage.service';
import { JwtAuthGuard } from '../../auth/api/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/api/decorators/current-user.decorator';
import { CurrentUserType } from '../../auth/api/types/request-with-user.type';
import { CurrentTokenUsageOutputModel } from './models/output/token-usage.output.model';

@ApiTags('Token Usage')
@Controller('token-usage')
export class TokenUsageController {
  constructor(private readonly tokenUsageService: TokenUsageService) {}

  @Get('current')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current token usage',
    description:
      'Returns the current day token usage for the authenticated user, including daily limit and remaining tokens.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current token usage retrieved successfully',
    type: CurrentTokenUsageOutputModel,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - valid JWT required',
  })
  async getCurrentUsage(
    @CurrentUser() user: CurrentUserType,
  ): Promise<CurrentTokenUsageOutputModel> {
    return this.tokenUsageService.getCurrentUsage(user.userId);
  }
}
