import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithUser, CurrentUserType } from '../types/request-with-user.type';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserType => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
