import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../app.module';
import * as fs from 'fs';
import * as path from 'path';

async function generateSwaggerJson() {
  const app = await NestFactory.create(AppModule, {
    logger: false,
  });

  const config = new DocumentBuilder()
    .setTitle('Nutri-AI API')
    .setDescription('The Nutri-AI API description')
    .setVersion('1.0')
    .addBearerAuth()
    .addBasicAuth(
      {
        type: 'http',
        scheme: 'basic',
      },
      'basicAuth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const outputPath = path.resolve(process.cwd(), 'swagger.json');
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));

  console.log(`Swagger JSON has been generated at: ${outputPath}`);

  await app.close();
}

generateSwaggerJson();
