import { describe, it, expect, beforeEach } from 'bun:test';
import {
  isTheHouseDirty,
  gf_isTheHouseDirty,
  mp_isTheHouseDirty,
  sf_isTheHouseDirty,
  vf_isTheHouseDirty,
  pp_isTheHouseDirty
} from '@/modules/dirty-checker/index.js';
import { createInitialState } from '@/state/index.js';
import { mainColumnAtt } from '@/constants/index.js';

describe('modules/dirty-checker', () => {
  let VARS;
  let mockDoc;

  beforeEach(() => {
    VARS = createInitialState();
  });

  describe('isTheHouseDirty', () => {
    it('detects unflagged mainColumn and sets first item in return array', () => {
      const mainCol = {
        hasAttribute: (attr) => attr !== mainColumnAtt,
        getAttribute: () => null,
        innerHTML: '<div>content</div>'
      };

      mockDoc = {
        querySelector: (sel) => (sel.includes('div[role="main"]') ? mainCol : null)
      };

      const [resCol, resDlg] = isTheHouseDirty(VARS, mockDoc);
      expect(resCol).toBe(mainCol);
      expect(resDlg).toBe(null);
      expect(VARS.noChangeCounter).toBe(1);
    });

    it('detects size change when mainColumn innerHTML length differs significantly', () => {
      const mainCol = {
        hasAttribute: (attr) => attr === mainColumnAtt,
        getAttribute: (attr) => (attr === mainColumnAtt ? '100' : null),
        innerHTML: 'a'.repeat(200) // changed size
      };

      mockDoc = {
        querySelector: (sel) => (sel.includes('div[role="main"]') ? mainCol : null)
      };

      const [resCol] = isTheHouseDirty(VARS, mockDoc);
      expect(resCol).toBe(mainCol);
    });

    it('returns [null, null] when no change and elements are already tagged', () => {
      const mainCol = {
        hasAttribute: (attr) => attr === mainColumnAtt,
        getAttribute: (attr) => (attr === mainColumnAtt ? '100' : null),
        innerHTML: 'a'.repeat(100) // identical size
      };

      mockDoc = {
        querySelector: (sel) => (sel.includes('div[role="main"]') ? mainCol : null)
      };

      const [resCol, resDlg] = isTheHouseDirty(VARS, mockDoc);
      expect(resCol).toBe(null);
      expect(resDlg).toBe(null);
    });
  });

  describe('mp_isTheHouseDirty', () => {
    it('returns mainColumn when found and unflagged in marketplace feed', () => {
      const mainCol = {
        hasAttribute: (attr) => false,
        getAttribute: () => null,
        innerHTML: 'items'
      };

      mockDoc = {
        querySelector: (sel) => (sel.includes('div[role="main"]') ? mainCol : null)
      };

      const res = mp_isTheHouseDirty(VARS, mockDoc);
      expect(res).toBe(mainCol);
    });
  });

  describe('sf_isTheHouseDirty', () => {
    it('returns mainColumn for search feed when changed', () => {
      const mainCol = {
        hasAttribute: (attr) => attr !== mainColumnAtt,
        getAttribute: () => null,
        innerHTML: 'search results'
      };

      mockDoc = {
        querySelector: (sel) => (sel.includes('div[role="main"]') ? mainCol : null)
      };

      const res = sf_isTheHouseDirty(VARS, mockDoc);
      expect(res).toBe(mainCol);
    });
  });

  describe('vf_isTheHouseDirty', () => {
    it('checks video feed mainColumn and dialog', () => {
      const mainCol = {
        hasAttribute: (attr) => false,
        getAttribute: () => null,
        innerHTML: 'videos'
      };

      mockDoc = {
        querySelectorAll: () => [mainCol],
        querySelector: () => null
      };

      const [resCol, resDlg] = vf_isTheHouseDirty(VARS, mockDoc);
      expect(resCol).toBe(mainCol);
      expect(resDlg).toBe(null);
    });
  });

  describe('pp_isTheHouseDirty', () => {
    it('checks profile page feed mainColumn and dialog', () => {
      const mainCol = {
        hasAttribute: (attr) => false,
        getAttribute: () => null,
        innerHTML: 'profile posts'
      };

      mockDoc = {
        querySelector: (sel) => (sel === 'div[role="main"]' ? mainCol : null)
      };

      const [resCol, resDlg] = pp_isTheHouseDirty(VARS, mockDoc);
      expect(resCol).toBe(mainCol);
      expect(resDlg).toBe(null);
    });
  });
});
