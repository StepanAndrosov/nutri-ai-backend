import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { appSettings } from 'src/setup/app-settings';

@Injectable()
export class AuthService {
  constructor() {}
  async generatePasswordHash(password: string): Promise<string> {
    const hash: string = await bcrypt.hash(password, appSettings.api.HASH_ROUNDS);
    return hash;
  }
}
