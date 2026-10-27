import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../database/entities';

export interface AuthenticatedUser {
  sub: string;
  email: string;
  role: UserRole;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser =>
    context.switchToHttp().getRequest<{ user: AuthenticatedUser }>().user,
);
