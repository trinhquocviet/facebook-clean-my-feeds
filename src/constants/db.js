/**
 * Database constants for IndexedDB persistence using idb-keyval.
 *
 * @module constants/db
 */

/**
 * Configuration for the userscript's IndexedDB storage.
 * @readonly
 * @type {{ DB_NAME: string, DB_STORE: string, DB_KEY: string }}
 */
export const DB_CONFIG = Object.freeze({
  DB_NAME: 'dbCMF',
  DB_STORE: 'Mopping',
  DB_KEY: 'Options',
});
