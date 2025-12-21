import { config } from 'dotenv';

config();

export type EnvironmentVariable = { [key: string]: string | undefined };
export type EnvironmentsTypes = 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION' | 'TESTING';
export const Environments = ['DEVELOPMENT', 'STAGING', 'PRODUCTION', 'TESTING'];

export class EnvironmentSettings {
  constructor(private env: EnvironmentsTypes) {}

  getEnv() {
    return this.env;
  }

  isProduction() {
    return this.env === 'PRODUCTION';
  }

  isStaging() {
    return this.env === 'STAGING';
  }

  isDevelopment() {
    return this.env === 'DEVELOPMENT';
  }

  isTesting() {
    return this.env === 'TESTING';
  }
}

export class AppSettings {
  constructor(
    public env: EnvironmentSettings,
    public api: APISettings,
  ) {}
}

class APISettings {
  // Application
  public readonly APP_PORT: number;
  public readonly HASH_ROUNDS: number;

  // Database
  public readonly MONGO_CONNECTION_URI: string;

  // JWT
  public readonly JWT_SECRET: string;
  public readonly JWT_EXPIRES_IN: string;

  // Food Database APIs
  public readonly USDA_API_KEY: string;
  public readonly USDA_API_URL: string;
  public readonly OPEN_FOOD_FACTS_API_URL: string;
  public readonly FOOD_CACHE_TTL_SECONDS: number;

  constructor(private readonly envVariables: EnvironmentVariable) {
    // Application
    this.APP_PORT = this.getNumberOrDefault(envVariables.APP_PORT ?? '', 7840);
    this.HASH_ROUNDS = this.getNumberOrDefault(envVariables.HASH_ROUNDS ?? '10', 10);

    // Database
    this.MONGO_CONNECTION_URI = envVariables.MONGO_CONNECTION_URI ?? 'mongodb://localhost/nest';
    // JWT
    this.JWT_SECRET = envVariables.JWT_SECRET ?? 'your-secret-key-change-in-production';
    this.JWT_EXPIRES_IN = envVariables.JWT_EXPIRES_IN ?? '7d';

    // Food Database APIs
    this.USDA_API_KEY = envVariables.USDA_API_KEY ?? 'DEMO_KEY';
    this.USDA_API_URL = envVariables.USDA_API_URL ?? 'https://api.nal.usda.gov/fdc/v1';
    this.OPEN_FOOD_FACTS_API_URL =
      envVariables.OPEN_FOOD_FACTS_API_URL ?? 'https://world.openfoodfacts.org/api/v2';
    this.FOOD_CACHE_TTL_SECONDS = this.getNumberOrDefault(
      envVariables.FOOD_CACHE_TTL_SECONDS ?? '604800',
      604800,
    );
  }

  private getNumberOrDefault(value: string, defaultValue: number): number {
    const parsedValue = Number(value);

    if (isNaN(parsedValue)) {
      return defaultValue;
    }

    return parsedValue;
  }
}

const env = new EnvironmentSettings(
  (Environments.includes(process.env.ENV?.trim() ?? '')
    ? (process.env.ENV?.trim() ?? '')
    : 'DEVELOPMENT') as EnvironmentsTypes,
);

const api = new APISettings(process.env);
export const appSettings = new AppSettings(env, api);
