import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  mongoUri: process.env.MONGO_CONNECTION_URI || 'mongodb://localhost/nest',
}));
