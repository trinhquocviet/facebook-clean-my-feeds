/**
 * User Options Orchestration & Lifecycle Module
 * Part of FB - Clean My Feeds
 */

import { resolveLanguage, applyDefaultOptions } from './defaults.js';
import { compileFilterRules } from './filters.js';
import { loadOptionsFromStorage, saveOptionsToStorage } from './storage.js';

/**
 * Loads user settings from IndexedDB, normalizes defaults, resolves language,
 * compiles filter arrays, and signals readiness on VARS.
 *
 * @param {Object} ctx - Application context container.
 * @returns {Promise<Object>} The resolved VARS.Options object.
 */
export async function getUserOptions(ctx) {
  const {
    VARS,
    DBVARS,
    masterKeyWords,
    cloneKeywords,
    log = '-- fbcmf :: '
  } = ctx;

  // Reset options state
  VARS.Options = {};
  VARS.optionsReady = false;

  // 1. Load saved options from storage
  const loaded = await loadOptionsFromStorage(DBVARS, log);
  const rawOptions = loaded || {};

  // 2. Language resolution
  const docLang = (typeof document !== 'undefined' && document.head?.parentNode?.lang) || 'en';
  const resolvedLang = resolveLanguage(
    rawOptions.CMF_DIALOG_LANGUAGE,
    docLang,
    masterKeyWords.translations,
    'en'
  );
  VARS.language = resolvedLang;
  rawOptions.CMF_DIALOG_LANGUAGE = resolvedLang;

  // 3. Update translation dictionary for current language
  if (typeof cloneKeywords === 'function') {
    cloneKeywords();
  }

  // 4. Apply default options and detect changes
  const { options, changed, hideAnInfoBox } = applyDefaultOptions(rawOptions, masterKeyWords.defaults);
  VARS.Options = options;
  VARS.hideAnInfoBox = hideAnInfoBox;

  // 5. Persist if missing defaults were applied (e.g. first run or schema migration)
  if (changed) {
    await saveOptionsToStorage(DBVARS, VARS.Options, log, VARS.Options.VERBOSITY_DEBUG);
  }

  // 6. Compile active filter arrays
  VARS.Filters = compileFilterRules(VARS.Options, VARS.SEP);

  // 7. Mark options as ready
  VARS.optionsReady = true;

  return VARS.Options;
}

/**
 * Waits for document.head to become available and then triggers getUserOptions().
 *
 * @param {Object} ctx - Application context container.
 * @param {number} [retryIntervalMs=5] - Polling retry interval.
 */
export function initLanguageAndOptions(ctx, retryIntervalMs = 5) {
  if (typeof document !== 'undefined' && document.head) {
    getUserOptions(ctx);
  } else if (typeof setTimeout === 'function') {
    setTimeout(() => initLanguageAndOptions(ctx, retryIntervalMs), retryIntervalMs);
  }
}
