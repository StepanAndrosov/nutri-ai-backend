import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { appSetup } from './setup/app.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  appSetup(app);
  app.enableCors({
    origin: ['http://localhost:3000', 'https://nutri-ai-gules.vercel.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = configService.get<number>('app.port') || 7840;
  const environment = configService.get<string>('app.environment') || 'DEVELOPMENT';

  await app.listen(port, () => {
    console.log('App starting listen port: ', port);
    console.log('ENV: ', environment);
  });
}

void bootstrap();
