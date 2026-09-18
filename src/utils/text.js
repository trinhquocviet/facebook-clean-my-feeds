/**
 * Text and string manipulation utilities for Facebook feed processing.
 * @module utils/text
 */

/**
 * Normalizes unicode text using Unicode Standard Annex #15 (NFKC).
 * Converts styled math unicode characters, fullwidth characters,
 * and ASCII 160 non-breaking spaces (\u00A0) to standard ASCII equivalents.
 *
 * @param {string} text - The input text to normalize.
 * @returns {string} Normalized string, or empty string if input is invalid.
 *
 * @example
 * cleanText('Sponsored\u00A0post'); // 'Sponsored post'
 * cleanText('𝐒𝐩𝐨𝐧𝐬𝐨𝐫𝐞𝐝'); // 'Sponsored'
 */
export function cleanText(text) {
  if (typeof text !== 'string') {
    return '';
  }
  return text.normalize('NFKC');
}

/**
 * Sanitizes reason text for safe inclusion inside HTML attributes.
 * Strips double quotation marks to prevent breaking attribute syntax.
 *
 * @param {string} reason - The reason string to sanitize.
 * @returns {string} Sanitized string without double quotes.
 *
 * @example
 * sanitizeReason('Blocked: "Sponsored" content'); // 'Blocked: Sponsored content'
 */
export function sanitizeReason(reason) {
  if (typeof reason !== 'string') {
    return '';
  }
  return reason.replaceAll('"', '');
}

/**
 * Generates a pseudo-random alphanumeric string.
 * The first character is guaranteed to be an alphabetic letter (A-Z, a-z)
 * so that the generated string is safe for use as a CSS class name or DOM identifier.
 *
 * @param {number} [length=13] - Desired string length (must be >= 1).
 * @returns {string} Random alphanumeric identifier.
 *
 * @example
 * generateRandomString(12); // 'a7B9x2Z1k0Lp'
 */
export function generateRandomString(length = 13) {
  if (typeof length !== 'number' || length < 1) {
    return '';
  }

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  // First character must be an alphabetic letter (first 52 chars in pool)
  const result = [chars.charAt(Math.floor(Math.random() * 52))];

  for (let i = 1; i < length; i++) {
    result.push(chars.charAt(Math.floor(Math.random() * 62)));
  }

  return result.join('');
}

/**
 * Searches an array of search terms for the first string included in targetText.
 *
 * @param {string} targetText - The text to search within.
 * @param {string[]} searchTerms - Array of strings to look for.
 * @returns {string} The first matched search term, or empty string if none found.
 *
 * @example
 * findFirstMatch('this is a sponsored post', ['ad', 'sponsored']); // 'sponsored'
 */
export function findFirstMatch(targetText, searchTerms) {
  if ((typeof targetText !== 'string' && !Array.isArray(targetText)) || !Array.isArray(searchTerms)) {
    return '';
  }

  const matched = searchTerms.find(term => typeof term === 'string' && targetText.includes(term));
  return matched !== undefined ? matched : '';
}

/**
 * Searches an array of regular expression patterns against targetText (case-insensitive).
 * Safely ignores invalid RegExp patterns without throwing uncaught exceptions.
 *
 * @param {string} targetText - The text to test against.
 * @param {string[]} patterns - Array of regex pattern strings.
 * @returns {string} The pattern string that matched first, or empty string if none matched.
 *
 * @example
 * findFirstMatchRegExp('Breaking news: product launch', ['^breaking', 'sale']); // '^breaking'
 */
export function findFirstMatchRegExp(targetText, patterns) {
  if (typeof targetText !== 'string' || !Array.isArray(patterns)) {
    return '';
  }

  for (const pattern of patterns) {
    if (typeof pattern !== 'string' || pattern.length === 0) {
      continue;
    }

    try {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(targetText)) {
        return pattern;
      }
    } catch {
      // Ignore malformed regex pattern provided in user filters
    }
  }

  return '';
}
