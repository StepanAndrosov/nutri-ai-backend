import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { appSettings } from 'src/setup/app-settings';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

export interface GoogleTokenPayload {
  email: string;
  name?: string;
  googleId: string;
  picture?: string;
}

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(private readonly jwtService: JwtService) {
    this.googleClient = new OAuth2Client(appSettings.api.GOOGLE_CLIENT_ID);
  }

  async generatePasswordHash(password: string): Promise<string> {
    const hash: string = await bcrypt.hash(password, appSettings.api.HASH_ROUNDS);
    return hash;
  }

  async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async generateAccessToken(userId: string, email: string): Promise<string> {
    const payload: JwtPayload = {
      sub: userId,
      email,
    };

    return this.jwtService.signAsync(payload);
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new Error('Invalid token');
    }
  }

  decodeToken(token: string): JwtPayload | null {
    return this.jwtService.decode<JwtPayload>(token);
  }

  async verifyGoogleToken(idToken: string): Promise<GoogleTokenPayload> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: appSettings.api.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload || !payload.email || !payload.sub) {
        throw new DomainException({
          code: DomainExceptionCode.Unauthorized,
          message: 'Invalid Google token payload',
        });
      }

      return {
        email: payload.email,
        name: payload.name,
        googleId: payload.sub,
        picture: payload.picture,
      };
    } catch {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Failed to verify Google token',
      });
    }
  }
}
