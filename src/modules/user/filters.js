/**
 * User Keyword Filters Compilation Module
 * Part of FB - Clean My Feeds
 *
 * Compiles newline- or delimiter-separated user keyword strings into
 * pre-tokenized and lowercase-cached arrays for rapid matching during feed processing.
 *
 * @module modules/user/filters
 */

import { FILTER_SEPARATOR } from '@/constants/index.js';

const FILTER_PREFIXES = ['NF', 'GF', 'VF', 'PP', 'GLOBAL'];

/**
 * Creates an empty canonical filter rules state object.
 *
 * Initializes token arrays and boolean enablement flags for all feed streams.
 *
 * @returns {Object} Empty canonical filters state
 */
function createInitialFilterState() {
  const state = {
    MP_BLOCKED_TEXT: [],
    MP_BLOCKED_TEXT_LC: [],
    MP_BLOCKED_TEXT_DESCRIPTION: [],
    MP_BLOCKED_TEXT_DESCRIPTION_LC: [],
    MP_BLOCKED_ENABLED: false,
  };

  for (const prefix of FILTER_PREFIXES) {
    state[`${prefix}_BLOCKED_TEXT`] = [];
    state[`${prefix}_BLOCKED_TEXT_LC`] = [];
    state[`${prefix}_BLOCKED_ENABLED`] = false;
  }

  return state;
}

/**
 * Splits raw delimited text into original tokens and lowercase tokens.
 *
 * ## Performance Optimization
 * Caching lowercase tokens (`tokensLC`) during option compilation avoids repeatedly
 * calling `.toLowerCase()` on hundreds of regex and keyword patterns during continuous
 * scroll iterations.
 *
 * @param {string} text - Raw delimited filter string from user textarea
 * @param {string} sep - Delimiter string (usually newline '\n' or '¦¦')
 * @returns {{ tokens: string[], tokensLC: string[] }} Tuple of raw and lowercase tokens
 */
function compileTokens(text, sep) {
  const tokens = text.split(sep);
  const tokensLC = tokens.map((t) => t.toLowerCase());
  return { tokens, tokensLC };
}

/**
 * Compiles feed keyword filter rules from user options into the canonical runtime Filters object.
 *
 * Populates token arrays for News Feed, Groups Feed, Video Feed, Profile Pages,
 * Global filters, and Marketplace price/description filters.
 *
 * @param {Object} options - User options dictionary
 * @param {string} [sep=FILTER_SEPARATOR] - Token delimiter (usually '\n' or '¦¦')
 * @returns {Object} Canonical Filters object ready for runtime text matching
 */
export function compileFilterRules(options = {}, sep = FILTER_SEPARATOR) {
  const filters = createInitialFilterState();

  const getFeedText = (prefix, textKey = `${prefix}_BLOCKED_TEXT`) =>
    options[`${prefix}_BLOCKED_ENABLED`] === true ? (options[textKey] || '') : '';

  for (const prefix of FILTER_PREFIXES) {
    const text = getFeedText(prefix);
    if (text.length > 0) {
      const { tokens, tokensLC } = compileTokens(text, sep);
      filters[`${prefix}_BLOCKED_ENABLED`] = true;
      filters[`${prefix}_BLOCKED_TEXT`] = tokens;
      filters[`${prefix}_BLOCKED_TEXT_LC`] = tokensLC;
    }
  }

  const mpPrices = getFeedText('MP');
  const mpDesc = getFeedText('MP', 'MP_BLOCKED_TEXT_DESCRIPTION');
  if (mpPrices.length > 0 || mpDesc.length > 0) {
    filters.MP_BLOCKED_ENABLED = true;
    if (mpPrices.length > 0) {
      const { tokens, tokensLC } = compileTokens(mpPrices, sep);
      filters.MP_BLOCKED_TEXT = tokens;
      filters.MP_BLOCKED_TEXT_LC = tokensLC;
    }
    if (mpDesc.length > 0) {
      const { tokens, tokensLC } = compileTokens(mpDesc, sep);
      filters.MP_BLOCKED_TEXT_DESCRIPTION = tokens;
      filters.MP_BLOCKED_TEXT_DESCRIPTION_LC = tokensLC;
    }
  }

  return filters;
}
