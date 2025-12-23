import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { DomainException, Extension } from '../../../core/exceptions/domain-exceptions';
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

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const googleClientId = this.configService.get<string>('google.clientId') || '';
    this.googleClient = new OAuth2Client(googleClientId);
  }

  async generatePasswordHash(password: string): Promise<string> {
    const hashRounds = this.configService.get<number>('app.hashRounds') || 10;
    const hash: string = await bcrypt.hash(password, hashRounds);
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

  async verifyGoogleToken(token: string): Promise<GoogleTokenPayload> {
    try {
      // Check if token is an access token (starts with ya29.) or ID token (JWT)
      const isAccessToken = token.startsWith('ya29.');

      if (isAccessToken) {
        // Verify access token by calling Google's tokeninfo endpoint
        return await this.verifyGoogleAccessToken(token);
      } else {
        // Verify ID token (JWT)
        return await this.verifyGoogleIdToken(token);
      }
    } catch (error) {
      // Log the actual error for debugging
      console.error('Google token verification failed:', error);

      // If it's already a DomainException, rethrow it
      if (error instanceof DomainException) {
        throw error;
      }

      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Failed to verify Google token',
        extensions: [
          new Extension(error instanceof Error ? error.message : String(error), 'originalError'),
        ],
      });
    }
  }

  private async verifyGoogleIdToken(idToken: string): Promise<GoogleTokenPayload> {
    const googleClientId = this.configService.get<string>('google.clientId') || '';
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email || !payload.sub) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Invalid Google ID token payload',
      });
    }

    return {
      email: payload.email,
      name: payload.name,
      googleId: payload.sub,
      picture: payload.picture,
    };
  }

  private async verifyGoogleAccessToken(accessToken: string): Promise<GoogleTokenPayload> {
    // Use Google OAuth2 API to get user info from access token
    const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userInfo = response.data;

    if (!userInfo.email || !userInfo.sub) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Invalid Google access token payload',
      });
    }

    return {
      email: userInfo.email,
      name: userInfo.name,
      googleId: userInfo.sub,
      picture: userInfo.picture,
    };
  }
}
