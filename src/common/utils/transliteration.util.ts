/**
 * Utility for transliterating Cyrillic text to Latin characters
 * Used for normalizing product names for efficient search
 */

const cyrillicToLatinMap: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'yo',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
  А: 'A',
  Б: 'B',
  В: 'V',
  Г: 'G',
  Д: 'D',
  Е: 'E',
  Ё: 'Yo',
  Ж: 'Zh',
  З: 'Z',
  И: 'I',
  Й: 'Y',
  К: 'K',
  Л: 'L',
  М: 'M',
  Н: 'N',
  О: 'O',
  П: 'P',
  Р: 'R',
  С: 'S',
  Т: 'T',
  У: 'U',
  Ф: 'F',
  Х: 'H',
  Ц: 'Ts',
  Ч: 'Ch',
  Ш: 'Sh',
  Щ: 'Sch',
  Ъ: '',
  Ы: 'Y',
  Ь: '',
  Э: 'E',
  Ю: 'Yu',
  Я: 'Ya',
};

/**
 * Transliterate Cyrillic text to Latin characters
 * @param text - Text to transliterate (may contain Cyrillic characters)
 * @returns Transliterated text with only Latin characters and numbers
 * @example
 * transliterate("Овсянка") // returns "Ovsyanka"
 * transliterate("Молоко 3.2%") // returns "Moloko32"
 */
export function transliterate(text: string): string {
  return text
    .split('')
    .map((char) => cyrillicToLatinMap[char] || char)
    .join('')
    .replace(/[^a-zA-Z0-9]/g, ''); // Remove all non-alphanumeric characters
}

/**
 * Normalize product name for search purposes
 * Converts to lowercase and transliterates Cyrillic to Latin
 * @param name - Product name to normalize
 * @returns Normalized name (lowercase, transliterated, alphanumeric only)
 * @example
 * normalizeProductName("Овсянка") // returns "ovsyanka"
 * normalizeProductName("Молоко 3.2%") // returns "moloko32"
 */
export function normalizeProductName(name: string): string {
  return transliterate(name).toLowerCase();
}
