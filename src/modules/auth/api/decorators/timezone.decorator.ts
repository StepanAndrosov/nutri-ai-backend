import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract timezone from request headers
 * Checks for timezone in the following order:
 * 1. X-Timezone header (e.g., 'Europe/Moscow')
 * 2. Timezone header
 * 3. Falls back to 'UTC' if not provided
 *
 * Usage:
 * @Get('example')
 * async example(@Timezone() timezone: string) {
 *   // timezone will contain the value from headers or 'UTC' as fallback
 * }
 */
export const Timezone = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();

  // Check for timezone in headers (case-insensitive)
  const timezone = request.headers['x-timezone'] || request.headers['timezone'] || 'UTC';

  return timezone as string;
});
