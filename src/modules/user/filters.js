/**
 * User Feed Filters Compilation Module
 * Part of FB - Clean My Feeds
 */

import { FILTER_SEPARATOR } from '../../constants/index.js';

/**
 * Compiles feed keyword filter rules from user options.
 * Resolves cross-feed text sharing matrix and precomputes lowercase tokens for high-speed scanning.
 *
 * @param {Object} options - User options dictionary.
 * @param {string} [sep=FILTER_SEPARATOR] - Token delimiter (usually '\n').
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
  };

  const nfBlockedText = options.NF_BLOCKED_ENABLED === true ? (options.NF_BLOCKED_TEXT || '') : '';
  const gfBlockedText = options.GF_BLOCKED_ENABLED === true ? (options.GF_BLOCKED_TEXT || '') : '';
  const vfBlockedText = options.VF_BLOCKED_ENABLED === true ? (options.VF_BLOCKED_TEXT || '') : '';
  const mpBlockedText = options.MP_BLOCKED_ENABLED === true ? (options.MP_BLOCKED_TEXT || '') : '';
  const mpBlockedTextDesc = options.MP_BLOCKED_ENABLED === true ? (options.MP_BLOCKED_TEXT_DESCRIPTION || '') : '';
  const ppBlockedText = options.PP_BLOCKED_ENABLED === true ? (options.PP_BLOCKED_TEXT || '') : '';

  // Cross-feed sharing rule:
  // ##_BLOCKED_FEED[X]: 0 = NF, 1 = GF, 2 = VF
  // Both feeds must be enabled before appending text list from one feed to another
  let nfBlockedTextList = '';
  if (options.NF_BLOCKED_ENABLED) {
    nfBlockedTextList = nfBlockedText;
    if (options.GF_BLOCKED_ENABLED && options.GF_BLOCKED_FEED && options.GF_BLOCKED_FEED[0] === '1') {
      if (gfBlockedText.length > 0) {
        nfBlockedTextList += (nfBlockedTextList.length > 0 ? sep : '') + gfBlockedText;
      }
    }
    if (options.VF_BLOCKED_ENABLED && options.VF_BLOCKED_FEED && options.VF_BLOCKED_FEED[0] === '1') {
      if (vfBlockedText.length > 0) {
        nfBlockedTextList += (nfBlockedTextList.length > 0 ? sep : '') + vfBlockedText;
      }
    }
  }

  let gfBlockedTextList = '';
  if (options.GF_BLOCKED_ENABLED) {
    gfBlockedTextList = gfBlockedText;
    if (options.NF_BLOCKED_ENABLED && options.NF_BLOCKED_FEED && options.NF_BLOCKED_FEED[1] === '1') {
      if (nfBlockedText.length > 0) {
        gfBlockedTextList += (gfBlockedTextList.length > 0 ? sep : '') + nfBlockedText;
      }
    }
    if (options.VF_BLOCKED_ENABLED && options.VF_BLOCKED_FEED && options.VF_BLOCKED_FEED[1] === '1') {
      if (vfBlockedText.length > 0) {
        gfBlockedTextList += (gfBlockedTextList.length > 0 ? sep : '') + vfBlockedText;
      }
    }
  }

  let vfBlockedTextList = '';
  if (options.VF_BLOCKED_ENABLED) {
    vfBlockedTextList = vfBlockedText;
    if (options.NF_BLOCKED_ENABLED && options.NF_BLOCKED_FEED && options.NF_BLOCKED_FEED[2] === '1') {
      if (nfBlockedText.length > 0) {
        vfBlockedTextList += (vfBlockedTextList.length > 0 ? sep : '') + nfBlockedText;
      }
    }
    if (options.GF_BLOCKED_ENABLED && options.GF_BLOCKED_FEED && options.GF_BLOCKED_FEED[2] === '1') {
      if (gfBlockedText.length > 0) {
        vfBlockedTextList += (vfBlockedTextList.length > 0 ? sep : '') + gfBlockedText;
      }
    }
  }

  // Populate News Feed filters
  if (options.NF_BLOCKED_ENABLED && nfBlockedTextList.length > 0) {
    filters.NF_BLOCKED_ENABLED = true;
    filters.NF_BLOCKED_TEXT = nfBlockedTextList.split(sep);
    filters.NF_BLOCKED_TEXT_LC = filters.NF_BLOCKED_TEXT.map((btext) => btext.toLowerCase());
  }

  // Populate Groups Feed filters
  if (options.GF_BLOCKED_ENABLED && gfBlockedTextList.length > 0) {
    filters.GF_BLOCKED_ENABLED = true;
    filters.GF_BLOCKED_TEXT = gfBlockedTextList.split(sep);
    filters.GF_BLOCKED_TEXT_LC = filters.GF_BLOCKED_TEXT.map((btext) => btext.toLowerCase());
  }

  // Populate Watch Videos Feed filters
  if (options.VF_BLOCKED_ENABLED && vfBlockedTextList.length > 0) {
    filters.VF_BLOCKED_ENABLED = true;
    filters.VF_BLOCKED_TEXT = vfBlockedTextList.split(sep);
    filters.VF_BLOCKED_TEXT_LC = filters.VF_BLOCKED_TEXT.map((btext) => btext.toLowerCase());
  }

  // Populate Marketplace Feed filters (prices + descriptions)
  if (options.MP_BLOCKED_ENABLED && (mpBlockedText.length > 0 || mpBlockedTextDesc.length > 0)) {
    filters.MP_BLOCKED_ENABLED = true;
    if (mpBlockedText.length > 0) {
      filters.MP_BLOCKED_TEXT = mpBlockedText.split(sep);
      filters.MP_BLOCKED_TEXT_LC = filters.MP_BLOCKED_TEXT.map((btext) => btext.toLowerCase());
    }
    if (mpBlockedTextDesc.length > 0) {
      filters.MP_BLOCKED_TEXT_DESCRIPTION = mpBlockedTextDesc.split(sep);
      filters.MP_BLOCKED_TEXT_DESCRIPTION_LC = filters.MP_BLOCKED_TEXT_DESCRIPTION.map((btext) => btext.toLowerCase());
    }
  }

  // Populate Profile Page filters
  if (options.PP_BLOCKED_ENABLED && ppBlockedText.length > 0) {
    filters.PP_BLOCKED_ENABLED = true;
    filters.PP_BLOCKED_TEXT = ppBlockedText.split(sep);
    filters.PP_BLOCKED_TEXT_LC = filters.PP_BLOCKED_TEXT.map((btext) => btext.toLowerCase());
  }

  return filters;
}
