import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsString, validateSync, IsOptional, Min, Max } from 'class-validator';

export enum Environment {
  Development = 'DEVELOPMENT',
  Staging = 'STAGING',
  Production = 'PRODUCTION',
  Testing = 'TESTING',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(65535)
  APP_PORT: number = 7840;

  @IsString()
  MONGO_CONNECTION_URI: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(20)
  HASH_ROUNDS: number = 10;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '7d';

  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_ID: string = '';

  @IsString()
  @IsOptional()
  USDA_API_KEY: string = 'DEMO_KEY';

  @IsString()
  @IsOptional()
  USDA_API_URL: string = 'https://api.nal.usda.gov/fdc/v1';

  @IsString()
  @IsOptional()
  OPEN_FOOD_FACTS_API_URL: string = 'https://world.openfoodfacts.org/api/v2';

  @IsNumber()
  @IsOptional()
  @Min(0)
  FOOD_CACHE_TTL_SECONDS: number = 604800;

  @IsString()
  OPENAI_API_KEY: string;

  @IsString()
  @IsOptional()
  OPENAI_MODEL: string = 'gpt-4.1-mini';

  @IsNumber()
  @IsOptional()
  @Min(100)
  @Max(4000)
  OPENAI_MAX_TOKENS: number = 2000;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  OPENAI_TEMPERATURE: number = 0.3;

  @IsNumber()
  @IsOptional()
  @Min(0)
  OPENAI_DAILY_TOKEN_LIMIT: number = 50000;

  @IsNumber()
  @IsOptional()
  @Min(0)
  OPENAI_FREE_TIER_DAILY_TOKEN_LIMIT: number = 10000;

  @IsNumber()
  @IsOptional()
  @Min(0)
  OPENAI_SUBSCRIBER_DAILY_TOKEN_LIMIT: number = 200000;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
