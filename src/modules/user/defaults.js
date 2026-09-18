/**
 * User Options Defaults & Language Resolution Module
 * Part of FB - Clean My Feeds
 *
 * Handles canonical option initialization, language resolution fallback hierarchy,
 * migration of legacy option keys, and aggregate info box calculation.
 *
 * @module modules/user/defaults
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
 * Resolves the active language code based on stored preferences and document language.
 *
 * ## Fallback Hierarchy
 * 1. Explicit user selection saved in options (`storedLang`).
 * 2. Document HTML lang attribute (`<html lang="...">` -> `docLang`).
 * 3. Default fallback code (`en`).
 *
 * @param {string|undefined} storedLang - Language code stored in user options
 * @param {string|undefined} docLang - Language code detected from document HTML
 * @param {Record<string, any>} translations - Supported translations table
 * @param {string} [fallback='en'] - Fallback language code
 * @returns {string} Resolved supported 2-letter language code
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
 * Applies default sponsored values across all feed streams if missing from options.
 *
 * Distributes generic `SPONSORED` default to `NF_SPONSORED`, `GF_SPONSORED`,
 * `VF_SPONSORED`, and `MP_SPONSORED`.
 *
 * @param {Object} options - Mutable options object
 * @param {Object} defaults - Canonical defaults dictionary
 * @returns {boolean} True if any default was newly assigned
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
 *
 * Also maps legacy `DLG_VERBOSITY` key into modern `VERBOSITY_LEVEL`.
 *
 * @param {Object} options - Mutable options object
 * @param {Object} defaults - Canonical defaults dictionary
 * @returns {boolean} True if any default was newly assigned
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
 * Applies empty string defaults for keyword filter textareas and count threshold fields.
 *
 * @param {Object} options - Mutable options object
 * @returns {boolean} True if any default was newly assigned
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
 *
 * @param {Object} options - Mutable options object
 * @param {Object} defaults - Canonical defaults dictionary
 * @returns {boolean} True if debug default was newly assigned
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
 *
 * Aggregates all specific information banner toggles (e.g. COVID, election,
 * climate notices) into a single quick-check boolean (`hideAnInfoBox`).
 *
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
 * @param {Object} rawOptions - Raw options loaded from IndexedDB storage
 * @param {Object} defaults - Canonical defaults from masterKeyWords.defaults
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
