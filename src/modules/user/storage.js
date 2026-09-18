/**
 * User Options Storage Module (IndexedDB Interface)
 * Part of FB - Clean My Feeds
 *
 * Provides persistence for user preferences, language selection, and blocked keywords
 * using IndexedDB (`idb-keyval`). This ensures configurations survive browser restarts
 * and Userscript manager updates.
 *
 * @module modules/user/storage
 */

import { get, set } from 'idb-keyval';

/**
 * Validates whether the IndexedDB configuration has required database parameters.
 *
 * @param {Object} dbVars - IndexedDB store configuration
 * @param {string} dbVars.DBKey - Primary key under which settings are saved
 * @param {Object} dbVars.ostore - Initialized idb-keyval custom store instance
 * @returns {boolean} True if store configuration is valid
 */
function isValidStoreConfig(dbVars) {
  return Boolean(dbVars && dbVars.DBKey && dbVars.ostore);
}

/**
 * Loads serialized options from IndexedDB storage.
 *
 * Safely parses the stored JSON string payload, returning null if missing or corrupted.
 *
 * @param {Object} dbVars - IndexedDB store configuration ({ DBKey, ostore })
 * @param {string} [logPrefix='-- fbcmf :: '] - Diagnostic log prefix
 * @returns {Promise<Object|null>} Parsed options object, or null if uninitialized/errored
 */
export async function loadOptionsFromStorage(dbVars, logPrefix = '-- fbcmf :: ') {
  if (!isValidStoreConfig(dbVars)) {
    return null;
  }
  try {
    const raw = await get(dbVars.DBKey, dbVars.ostore);
    if (raw) {
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    }
    return null;
  } catch (err) {
    console.info(`${logPrefix}getUserOptions() > get() - Error:`, err);
    return null;
  }
}

/**
 * Serializes and saves options to IndexedDB storage.
 *
 * Converts options object to JSON string and persists it to the dedicated object store.
 *
 * @param {Object} dbVars - IndexedDB store configuration ({ DBKey, ostore })
 * @param {Object} options - User options object to serialize and save
 * @param {string} [logPrefix='-- fbcmf :: '] - Diagnostic log prefix
 * @param {boolean} [isDebug=false] - Debug logging flag
 * @returns {Promise<boolean>} True if saved successfully, false on error
 */
export async function saveOptionsToStorage(dbVars, options, logPrefix = '-- fbcmf :: ', isDebug = false) {
  if (!isValidStoreConfig(dbVars)) {
    return false;
  }
  try {
    const payload = JSON.stringify(options);
    await set(dbVars.DBKey, payload, dbVars.ostore);
    if (isDebug) {
      console.info(`${logPrefix}Changed - success`);
    }
    return true;
  } catch (err) {
    console.info(`${logPrefix}getUserOptions() > changed > saving - failed, Error: ${err}`);
    if (isDebug) {
      console.info(`${logPrefix}Changed - failed`);
    }
    return false;
  }
}
