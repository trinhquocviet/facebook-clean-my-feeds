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
export function resolveLanguage(storedLang, docLang, translations = {}, fallback = 'en') {
  if (storedLang && Object.prototype.hasOwnProperty.call(translations, storedLang)) {
    return storedLang;
  }
  if (docLang && Object.prototype.hasOwnProperty.call(translations, docLang)) {
    return docLang;
  }
  return fallback;
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

  // 1. Sponsored options (always default to defaults.SPONSORED)
  const sponsoredKeys = ['NF_SPONSORED', 'GF_SPONSORED', 'VF_SPONSORED', 'MP_SPONSORED'];
  const sponsoredDefault = defaults['SPONSORED'] ?? true;
  for (const key of sponsoredKeys) {
    if (!Object.prototype.hasOwnProperty.call(options, key)) {
      options[key] = sponsoredDefault;
      changed = true;
    }
  }

  // 2. Canonical defaults from defaults dictionary
  for (const [key, value] of Object.entries(defaults)) {
    if (key === 'SPONSORED') {
      continue;
    }
    if (key === 'DLG_VERBOSITY') {
      if (!Object.prototype.hasOwnProperty.call(options, 'VERBOSITY_LEVEL')) {
        options.VERBOSITY_LEVEL = value;
        changed = true;
      }
      continue;
    }
    if (!Object.prototype.hasOwnProperty.call(options, key)) {
      options[key] = value;
      changed = true;
    }
  }

  // 3. String text fields that default to empty string
  const stringDefaults = [
    'NF_BLOCKED_TEXT',
    'GF_BLOCKED_TEXT',
    'VF_BLOCKED_TEXT',
    'MP_BLOCKED_TEXT',
    'MP_BLOCKED_TEXT_DESCRIPTION',
    'PP_BLOCKED_TEXT',
    'NF_LIKES_MAXIMUM_COUNT',
  ];
  for (const key of stringDefaults) {
    if (!Object.prototype.hasOwnProperty.call(options, key)) {
      options[key] = '';
      changed = true;
    }
  }

  // 4. VERBOSITY_DEBUG safety check
  if (
    !Object.prototype.hasOwnProperty.call(options, 'VERBOSITY_DEBUG') ||
    options.VERBOSITY_DEBUG === undefined ||
    options.VERBOSITY_DEBUG.toString() === ''
  ) {
    options.VERBOSITY_DEBUG = defaults.VERBOSITY_DEBUG ?? false;
    changed = true;
  }

  // 5. Compute hideAnInfoBox flag from OTHER_INFO_* options
  let hideAnInfoBox = false;
  for (const [key, val] of Object.entries(options)) {
    if (key.startsWith('OTHER_INFO') && Boolean(val)) {
      hideAnInfoBox = true;
      break;
    }
  }

  return {
    options,
    changed,
    hideAnInfoBox,
  };
}
