/**
 * User Feed Filters Compilation Module
 * Compiles feed keyword filter rules from user options.
 * Each feed section's text filter serves only that section (per-section isolation).
 * Precomputes lowercase tokens for high-speed scanning.
 * Part of FB - Clean My Feeds
 */

import { FILTER_SEPARATOR } from '@/constants/index.js';

/**
 * Compiles feed keyword filter rules from user options.
 *
 * @param {Object} options - User options dictionary.
 * @param {string} [sep=FILTER_SEPARATOR] - Token delimiter (usually '\n' or '¦¦').
 * @returns {Object} Canonical Filters object.
 */
export function compileFilterRules(options = {}, sep = FILTER_SEPARATOR) {
  const filters = {
    NF_BLOCKED_TEXT: [],
    NF_BLOCKED_TEXT_LC: [],
    NF_BLOCKED_ENABLED: false,
    GF_BLOCKED_TEXT: [],
    GF_BLOCKED_TEXT_LC: [],
    GF_BLOCKED_ENABLED: false,
    VF_BLOCKED_TEXT: [],
    VF_BLOCKED_TEXT_LC: [],
    VF_BLOCKED_ENABLED: false,
    MP_BLOCKED_TEXT: [],
    MP_BLOCKED_TEXT_LC: [],
    MP_BLOCKED_TEXT_DESCRIPTION: [],
    MP_BLOCKED_TEXT_DESCRIPTION_LC: [],
    MP_BLOCKED_ENABLED: false,
    PP_BLOCKED_TEXT: [],
    PP_BLOCKED_TEXT_LC: [],
    PP_BLOCKED_ENABLED: false,
    GLOBAL_BLOCKED_TEXT: [],
    GLOBAL_BLOCKED_TEXT_LC: [],
    GLOBAL_BLOCKED_ENABLED: false,
  };

  const feed = (prefix, textKey = `${prefix}_BLOCKED_TEXT`) =>
    options[`${prefix}_BLOCKED_ENABLED`] === true ? (options[textKey] || '') : '';

  for (const prefix of ['NF', 'GF', 'VF', 'PP', 'GLOBAL']) {
    const text = feed(prefix);
    if (text.length > 0) {
      filters[`${prefix}_BLOCKED_ENABLED`] = true;
      filters[`${prefix}_BLOCKED_TEXT`] = text.split(sep);
      filters[`${prefix}_BLOCKED_TEXT_LC`] = filters[`${prefix}_BLOCKED_TEXT`].map((t) => t.toLowerCase());
    }
  }

  const mpPrices = feed('MP');
  const mpDesc = feed('MP', 'MP_BLOCKED_TEXT_DESCRIPTION');
  if (mpPrices.length > 0 || mpDesc.length > 0) {
    filters.MP_BLOCKED_ENABLED = true;
    if (mpPrices.length > 0) {
      filters.MP_BLOCKED_TEXT = mpPrices.split(sep);
      filters.MP_BLOCKED_TEXT_LC = filters.MP_BLOCKED_TEXT.map((t) => t.toLowerCase());
    }
    if (mpDesc.length > 0) {
      filters.MP_BLOCKED_TEXT_DESCRIPTION = mpDesc.split(sep);
      filters.MP_BLOCKED_TEXT_DESCRIPTION_LC = filters.MP_BLOCKED_TEXT_DESCRIPTION.map((t) => t.toLowerCase());
    }
  }

  return filters;
}
