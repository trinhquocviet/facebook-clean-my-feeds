import { describe, it, expect, mock } from 'bun:test';
import { getUserOptions, initLanguageAndOptions } from '@/modules/user/user-options.js';
import { createInitialState } from '@/state/index.js';
import { masterKeyWords } from '@/i18n/index.js';

describe('modules/user/user-options', () => {
  describe('getUserOptions', () => {
    it('initializes defaults, resolves language, compiles filters, and marks optionsReady', async () => {
      const VARS = createInitialState();
      const cloneKeywordsMock = mock(() => {});

      const ctx = {
        VARS,
        DBVARS: { DBKey: null, ostore: null }, // Trigger fallback/empty
        masterKeyWords,
        cloneKeywords: cloneKeywordsMock,
        log: '-- test :: ',
      };

      const options = await getUserOptions(ctx);

      expect(VARS.optionsReady).toBe(true);
      expect(cloneKeywordsMock).toHaveBeenCalled();
      expect(VARS.language).toBe('en');
      expect(options.NF_SPONSORED).toBe(true);
      expect(VARS.Filters).toBeDefined();
      expect(VARS.Filters.NF_BLOCKED_ENABLED).toBe(false);
      expect(VARS.hideAnInfoBox).toBe(false);
    });
  });

  describe('initLanguageAndOptions', () => {
    it('executes without throwing', () => {
      const VARS = createInitialState();
      const ctx = {
        VARS,
        DBVARS: { DBKey: null, ostore: null },
        masterKeyWords,
        cloneKeywords: () => {},
        log: '-- test :: ',
      };

      expect(() => initLanguageAndOptions(ctx)).not.toThrow();
    });
  });
});
