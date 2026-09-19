/**
 * Mobile-specific internationalization dictionary resolver.
 *
 * @module i18n/mobile/index
 */

import en from './en.js';
import vi from './vi.js';

const mobileLocales = {
  en,
  vi
};

/**
 * Resolves mobile keywords dictionary for a given language code.
 * Falls back to English if language is not explicitly defined.
 *
 * @param {string} [lang='en'] - Language code (e.g. 'en', 'vi')
 * @returns {Object} Mobile keyword dictionary
 */
export function getMobileKeywords(lang = 'en') {
  const normalized = (lang || '').toLowerCase().slice(0, 2);
  return mobileLocales[normalized] || en;
}

export { en as mobileEn, vi as mobileVi };
