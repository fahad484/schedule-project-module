import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthenticatedUser } from '../common/authenticated-user';

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const bearer = request.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    const cookie = request.headers.cookie
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('medinest_session='))
      ?.slice('medinest_session='.length);
    const token = bearer ?? (cookie ? decodeURIComponent(cookie) : undefined);
    if (!token) throw new UnauthorizedException('Sign in to continue.');

    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
      throw new ServiceUnavailableException('Authentication is not configured. Set a JWT_SECRET of at least 32 characters.');
    }

    try {
      request.user = await this.jwtService.verifyAsync<AuthenticatedUser>(token, { secret });
    } catch {
      throw new UnauthorizedException('Your session is invalid or has expired.');
    }
    return true;
  }
}
