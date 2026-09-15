/**
 * User Options Storage Module (IndexedDB Interface)
 * Part of FB - Clean My Feeds
 */

import { get, set } from 'idb-keyval';

/**
 * Loads serialized options from IndexedDB storage.
 *
 * @param {Object} dbVars - IndexedDB store configuration ({ DBKey, ostore }).
 * @param {string} [logPrefix='-- fbcmf :: '] - Log prefix.
 * @returns {Promise<Object|null>} Parsed options object or null if not found/error.
 */
export async function loadOptionsFromStorage(dbVars, logPrefix = '-- fbcmf :: ') {
  if (!dbVars || !dbVars.DBKey || !dbVars.ostore) {
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
 * @param {Object} dbVars - IndexedDB store configuration ({ DBKey, ostore }).
 * @param {Object} options - Options object to save.
 * @param {string} [logPrefix='-- fbcmf :: '] - Log prefix.
 * @param {boolean} [isDebug=false] - Debug logging flag.
 * @returns {Promise<boolean>} True if saved successfully, false otherwise.
 */
export async function saveOptionsToStorage(dbVars, options, logPrefix = '-- fbcmf :: ', isDebug = false) {
  if (!dbVars || !dbVars.DBKey || !dbVars.ostore) {
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
