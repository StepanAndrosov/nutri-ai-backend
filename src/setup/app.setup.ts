import { INestApplication } from '@nestjs/common';
import { swaggerSetup } from './swagger.setup';

export function appSetup(app: INestApplication) {
  swaggerSetup(app);
}
