import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UsersQueryRepository } from '../../../user-accounts/infrastructure/users.query-repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') || 'your-secret-key-change-in-production',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersQueryRepository.getById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found or token is invalid');
    }

    // The returned object will be attached to req.user
    return {
      userId: payload.sub,
      email: payload.email,
    };
  }
}
