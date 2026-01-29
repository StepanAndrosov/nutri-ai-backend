import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../domain/user-role.enum';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RequestWithUser } from '../types/request-with-user.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Authentication required',
      });
    }

    const hasRole = requiredRoles.includes(user.role as UserRole);

    if (!hasRole) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Insufficient permissions',
      });
    }

    return true;
  }
}
