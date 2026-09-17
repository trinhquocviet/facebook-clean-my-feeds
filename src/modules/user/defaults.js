/**
 * User Options Defaults & Language Resolution Module
 * Part of FB - Clean My Feeds
 */

/**
 * Resolves active language code based on stored preferences and document language.
 *
 * @param {string|undefined} storedLang - Language code stored in user options.
 * @param {string|undefined} docLang - Language code detected from document HTML.
 * @param {Record<string, any>} translations - Supported translations table.
 * @param {string} [fallback='en'] - Fallback language code.
 * @returns {string} Resolved language code.
 */
const hasKey = (obj, key) => Boolean(obj && Object.prototype.hasOwnProperty.call(obj, key));

const SPONSORED_KEYS = ['NF_SPONSORED', 'GF_SPONSORED', 'VF_SPONSORED', 'MP_SPONSORED'];

const STRING_DEFAULT_KEYS = [
  'GLOBAL_BLOCKED_TEXT',
  'NF_BLOCKED_TEXT',
  'GF_BLOCKED_TEXT',
  'VF_BLOCKED_TEXT',
  'MP_BLOCKED_TEXT',
  'MP_BLOCKED_TEXT_DESCRIPTION',
  'PP_BLOCKED_TEXT',
  'NF_LIKES_MAXIMUM_COUNT',
];

/**
 * Resolves active language code based on stored preferences and document language.
 *
 * @param {string|undefined} storedLang - Language code stored in user options.
 * @param {string|undefined} docLang - Language code detected from document HTML.
 * @param {Record<string, any>} translations - Supported translations table.
 * @param {string} [fallback='en'] - Fallback language code.
 * @returns {string} Resolved language code.
 */
export function resolveLanguage(storedLang, docLang, translations = {}, fallback = 'en') {
  if (hasKey(translations, storedLang)) {
    return storedLang;
  }
  if (hasKey(translations, docLang)) {
    return docLang;
  }
  return fallback;
}

/**
 * Applies default sponsored values if missing from options.
 * @param {Object} options - Mutable options object
 * @param {Object} defaults - Canonical defaults dictionary
 * @returns {boolean} Whether any default was applied
 */
function applySponsoredDefaults(options, defaults) {
  let changed = false;
  const sponsoredDefault = defaults['SPONSORED'] ?? true;
  for (const key of SPONSORED_KEYS) {
    if (!hasKey(options, key)) {
      options[key] = sponsoredDefault;
      changed = true;
    }
  }
  return changed;
}

/**
 * Applies canonical default options from the defaults dictionary.
 * @param {Object} options - Mutable options object
 * @param {Object} defaults - Canonical defaults dictionary
 * @returns {boolean} Whether any default was applied
 */
function applyCanonicalDefaults(options, defaults) {
  let changed = false;
  for (const [key, value] of Object.entries(defaults)) {
    if (key === 'SPONSORED') {
      continue;
    }
    if (key === 'DLG_VERBOSITY') {
      if (!hasKey(options, 'VERBOSITY_LEVEL')) {
        options.VERBOSITY_LEVEL = value;
        changed = true;
      }
      continue;
    }
    if (!hasKey(options, key)) {
      options[key] = value;
      changed = true;
    }
  }
  return changed;
}

/**
 * Applies empty string defaults for text filter and threshold fields.
 * @param {Object} options - Mutable options object
 * @returns {boolean} Whether any default was applied
 */
function applyStringDefaults(options) {
  let changed = false;
  for (const key of STRING_DEFAULT_KEYS) {
    if (!hasKey(options, key)) {
      options[key] = '';
      changed = true;
    }
  }
  return changed;
}

/**
 * Ensures VERBOSITY_DEBUG option has a valid boolean default.
 * @param {Object} options - Mutable options object
 * @param {Object} defaults - Canonical defaults dictionary
 * @returns {boolean} Whether any default was applied
 */
function applyDebugDefault(options, defaults) {
  if (
    !hasKey(options, 'VERBOSITY_DEBUG') ||
    options.VERBOSITY_DEBUG === undefined ||
    options.VERBOSITY_DEBUG.toString() === ''
  ) {
    options.VERBOSITY_DEBUG = defaults.VERBOSITY_DEBUG ?? false;
    return true;
  }
  return false;
}

/**
 * Computes whether an info box should be hidden based on OTHER_INFO_* flags.
 * @param {Object} options - User options object
 * @returns {boolean} True if any OTHER_INFO flag is truthy
 */
function computeHideInfoBox(options) {
  for (const [key, val] of Object.entries(options)) {
    if (key.startsWith('OTHER_INFO') && Boolean(val)) {
      return true;
    }
  }
  return false;
}

/**
 * Normalizes user options by filling in missing defaults, setting up text fields,
 * and determining whether any default was applied or if info box should be hidden.
 *
 * @param {Object} rawOptions - Raw options loaded from storage.
 * @param {Object} defaults - Canonical defaults from masterKeyWords.defaults.
 * @returns {{ options: Object, changed: boolean, hideAnInfoBox: boolean }}
 */
export function applyDefaultOptions(rawOptions = {}, defaults = {}) {
  const options = { ...rawOptions };
  let changed = false;

  changed = applySponsoredDefaults(options, defaults) || changed;
  changed = applyCanonicalDefaults(options, defaults) || changed;
  changed = applyStringDefaults(options) || changed;
  changed = applyDebugDefault(options, defaults) || changed;

  const hideAnInfoBox = computeHideInfoBox(options);

  return {
    options,
    changed,
    hideAnInfoBox,
  };
}
