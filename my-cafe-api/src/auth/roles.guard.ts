import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { UserRole } from '../users/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // JWT Strategy’den gelir

    if (!user) throw new ForbiddenException('Kullanıcı doğrulanamadı');

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Bu işlem için gerekli role sahip değilsiniz: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
