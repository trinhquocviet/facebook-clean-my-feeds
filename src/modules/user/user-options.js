/**
 * User Options Orchestration & Lifecycle Module
 * Part of FB - Clean My Feeds
 *
 * Coordinates loading, normalizing, schema migration, language resolution,
 * and filter compilation for the userscript.
 *
 * @module modules/user/user-options
 */

import { resolveLanguage, applyDefaultOptions } from './defaults.js';
import { compileFilterRules } from './filters.js';
import { loadOptionsFromStorage, saveOptionsToStorage } from './storage.js';

/**
 * Loads user settings from IndexedDB, normalizes defaults, resolves language,
 * compiles filter arrays, and signals readiness on VARS.
 *
 * ## 7-Step Lifecycle:
 * 1. **Storage Load**: Retrieves persisted options JSON from IndexedDB via `loadOptionsFromStorage`.
 * 2. **Language Resolution**: Matches stored `CMF_DIALOG_LANGUAGE` against document lang and supported locales.
 * 3. **Dictionary Refresh**: Invokes `cloneKeywords()` to update localized translation strings.
 * 4. **Schema Normalization**: Applies defaults for any newly introduced options via `applyDefaultOptions`.
 * 5. **Auto-Persist**: If new default values were added (e.g. first run or upgrade migration), persists them.
 * 6. **Filter Compilation**: Compiles newline-delimited keywords into token arrays via `compileFilterRules`.
 * 7. **Ready Signal**: Sets `VARS.optionsReady = true`, unblocking startup of the main scheduler.
 *
 * @param {Object} ctx - Application context container
 * @param {Object} ctx.VARS - Application global state
 * @param {Object} ctx.DBVARS - IndexedDB store configuration
 * @param {Object} ctx.masterKeyWords - Keywords and translations master object
 * @param {Function} ctx.cloneKeywords - Callback to update active translation dictionary
 * @param {string} [ctx.log] - Log prefix
 * @returns {Promise<Object>} The resolved and normalized VARS.Options object
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
 * Waits for `document.head` to become available before triggering `getUserOptions()`.
 *
 * Because the userscript injects at `@run-at document-start`, `document.head` or `document.body`
 * may not be initially instantiated. This sets a rapid 5ms polling loop until `document.head` exists.
 *
 * @param {Object} ctx - Application context container
 * @param {number} [retryIntervalMs=5] - Polling retry interval in milliseconds
 */
export function initLanguageAndOptions(ctx, retryIntervalMs = 5) {
  if (!ctx) return;
  if (typeof document !== 'undefined' && document.head) {
    getUserOptions(ctx);
  } else if (typeof setTimeout === 'function') {
    setTimeout(() => initLanguageAndOptions(ctx, retryIntervalMs), retryIntervalMs);
  }
}
