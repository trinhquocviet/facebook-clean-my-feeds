import { describe, it, expect, mock } from 'bun:test';
import { loadOptionsFromStorage, saveOptionsToStorage } from '../../src/modules/user/storage.js';

describe('modules/user/storage', () => {
  const validDbVars = {
    DBKey: 'FBCMF_OPTIONS',
    ostore: { name: 'test_store' },
  };

  describe('loadOptionsFromStorage', () => {
    it('returns null if dbVars is invalid or missing store', async () => {
      expect(await loadOptionsFromStorage(null)).toBeNull();
      expect(await loadOptionsFromStorage({})).toBeNull();
      expect(await loadOptionsFromStorage({ DBKey: 'key' })).toBeNull();
    });
  });

  describe('saveOptionsToStorage', () => {
    it('returns false if dbVars is invalid or missing store', async () => {
      expect(await saveOptionsToStorage(null, {})).toBe(false);
      expect(await saveOptionsToStorage({}, {})).toBe(false);
      expect(await saveOptionsToStorage({ DBKey: 'key' }, {})).toBe(false);
    });
  });
});
