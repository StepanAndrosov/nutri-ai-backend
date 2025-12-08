import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { appSettings } from 'src/setup/app-settings';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UsersQueryRepository } from '../../../user-accounts/infrastructure/users.query-repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersQueryRepository: UsersQueryRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: appSettings.api.JWT_SECRET,
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
