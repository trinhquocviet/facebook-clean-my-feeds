import { translations } from './locales/index.js';
import { defaults } from './defaults.js';
import { pathInfo } from './paths.js';
import {
  getTranslation as getTranslationHelper,
  getSupportedLanguages as getSupportedLanguagesHelper,
  buildSponsoredDictionary as buildSponsoredDictionaryHelper,
  buildReelsDictionary as buildReelsDictionaryHelper,
} from './helpers.js';

export { translations } from './locales/index.js';
export { defaults } from './defaults.js';
export { pathInfo } from './paths.js';

/**
 * Resolves translation object with English fallback.
 * @param {string} [langCode]
 * @returns {Record<string, any>}
 */
export const getTranslation = (langCode) => getTranslationHelper(langCode, translations);

/**
 * Returns array of supported languages for select menus.
 * @returns {Array<{ code: string, name: string, direction: string }>}
 */
export const getSupportedLanguages = () => getSupportedLanguagesHelper(translations);

/**
 * Builds list of lowercase sponsored keywords across all languages.
 * @returns {string[]}
 */
export const buildSponsoredDictionary = () => buildSponsoredDictionaryHelper(translations);

/**
 * Builds list of reels keywords across all languages.
 * @returns {string[]}
 */
export const buildReelsDictionary = () => buildReelsDictionaryHelper(translations);

/**
 * Composite keywords and configuration object for 100% backward compatibility with legacy consumers.
 */
export const masterKeyWords = {
  translations,
  defaults,
  pathInfo,
};

export default masterKeyWords;
