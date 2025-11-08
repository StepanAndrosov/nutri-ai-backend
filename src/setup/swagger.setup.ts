import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function swaggerSetup(app: INestApplication) {
  const SWAGGER_PATH = 'swagger';

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
  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    customSiteTitle: ' Nutri-AI Swagger',
  });
}
