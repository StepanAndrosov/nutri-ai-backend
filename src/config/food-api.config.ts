import { registerAs } from '@nestjs/config';

export default registerAs('foodApi', () => ({
  usda: {
    apiKey: process.env.USDA_API_KEY || 'DEMO_KEY',
    apiUrl: process.env.USDA_API_URL || 'https://api.nal.usda.gov/fdc/v1',
  },
  openFoodFacts: {
    apiUrl: process.env.OPEN_FOOD_FACTS_API_URL || 'https://world.openfoodfacts.org/api/v2',
  },
  cacheTtlSeconds: parseInt(process.env.FOOD_CACHE_TTL_SECONDS || '604800', 10),
}));
