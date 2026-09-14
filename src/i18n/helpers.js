import { translations as defaultTranslations } from './locales/index.js';

/**
 * Resolves a translation dictionary for the given language code with fallback to English baseline.
 * Guarantees that all required keys are defined even if the targeted locale is incomplete.
 * 
 * @param {string} [langCode='en'] - ISO language code (e.g. 'en', 'vi', 'zh-Hans')
 * @param {Record<string, any>} [translationsMap=defaultTranslations] - Full map of locales
 * @returns {Record<string, any>} Merged translation object
 */
export function getTranslation(langCode, translationsMap = defaultTranslations) {
  const base = translationsMap.en || {};
  if (!langCode || !translationsMap[langCode]) {
    return { ...base };
  }
  return {
    ...base,
    ...translationsMap[langCode],
  };
}

/**
 * Returns a list of supported language metadata for UI dropdowns.
 * 
 * @param {Record<string, any>} [translationsMap=defaultTranslations] - Full map of locales
 * @returns {Array<{ code: string, name: string, direction: string }>} List of language descriptors
 */
export function getSupportedLanguages(translationsMap = defaultTranslations) {
  return Object.entries(translationsMap).map(([code, trans]) => ({
    code,
    name: trans.CMF_DIALOG_LANGUAGE || code,
    direction: trans.LANGUAGE_DIRECTION || 'ltr',
  }));
}

/**
 * Builds a deduplicated list of lowercase sponsored keywords across all languages.
 * 
 * @param {Record<string, any>} [translationsMap=defaultTranslations] - Full map of locales
 * @returns {string[]} Lowercase sponsored phrases
 */
export function buildSponsoredDictionary(translationsMap = defaultTranslations) {
  const values = Object.values(translationsMap).flatMap((trans) => [
    trans.SPONSORED?.toLowerCase(),
    trans.SPONSORED_EXTRA?.toLowerCase(),
  ]).filter(Boolean);

  return Array.from(new Set(values));
}

/**
 * Builds a deduplicated list of reels and short video keywords across all languages.
 * 
 * @param {Record<string, any>} [translationsMap=defaultTranslations] - Full map of locales
 * @returns {string[]} Reel keywords
 */
export function buildReelsDictionary(translationsMap = defaultTranslations) {
  const values = Object.values(translationsMap)
    .map((trans) => trans.NF_REELS_SHORT_VIDEOS)
    .filter(Boolean);

  return Array.from(new Set(values));
}
