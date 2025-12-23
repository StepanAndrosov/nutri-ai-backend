import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.APP_PORT || '7840', 10),
  hashRounds: parseInt(process.env.HASH_ROUNDS || '10', 10),
  environment: process.env.ENV || 'DEVELOPMENT',
}));
