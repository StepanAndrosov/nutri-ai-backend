/**
 * Expected response structure from GPT when parsing meal description
 */
export interface GptMealParseResponse {
  confidence: number; // 0-1, overall confidence in the parsing
  items: ParsedMealItem[];
}

export interface ParsedMealItem {
  name: string; // Product name as understood by GPT
  quantity: number; // Quantity in grams
  searchTerms: string[]; // Alternative search terms (Russian, transliterated, English)
}
