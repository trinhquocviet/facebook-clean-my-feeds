import { describe, it, expect, beforeEach } from 'bun:test';
import {
  isGloballyBlockedText,
  nf_isBlockedText,
  mp_getBlockedPrices
} from '@/modules/detection/text-filter.js';
import { createInitialState } from '@/state/index.js';

describe('modules/detection/text-filter', () => {
  let VARS;

  beforeEach(() => {
    VARS = createInitialState();
  });

  describe('isGloballyBlockedText', () => {
    it('returns empty string if GLOBAL_BLOCKED_ENABLED is false', () => {
      VARS.Options.GLOBAL_BLOCKED_ENABLED = false;
      VARS.Filters.GLOBAL_BLOCKED_TEXT_LC = ['crypto'];
      expect(isGloballyBlockedText('crypto scam', VARS)).toBe('');
    });

    it('matches plain keywords when enabled', () => {
      VARS.Options.GLOBAL_BLOCKED_ENABLED = true;
      VARS.Options.GLOBAL_BLOCKED_RE = false;
      VARS.Filters.GLOBAL_BLOCKED_TEXT_LC = ['crypto', 'nft'];

      expect(isGloballyBlockedText('latest crypto news', VARS)).toBe('crypto');
      expect(isGloballyBlockedText('regular post', VARS)).toBe('');
    });

    it('matches regex expressions when GLOBAL_BLOCKED_RE is true', () => {
      VARS.Options.GLOBAL_BLOCKED_ENABLED = true;
      VARS.Options.GLOBAL_BLOCKED_RE = true;
      VARS.Filters.GLOBAL_BLOCKED_TEXT_LC = ['\\b(sale|discount)\\b'];

      expect(isGloballyBlockedText('huge discount today', VARS)).toBe('\\b(sale|discount)\\b');
    });
  });

  describe('mp_getBlockedPrices', () => {
    it('returns matched price string from marketplace price block', () => {
      VARS.Filters.MP_BLOCKED_TEXT = ['$0', 'free'];
      VARS.Filters.MP_BLOCKED_TEXT_LC = ['$0', 'free'];

      const mockDoc = {
        createTreeWalker: () => {
          const items = [{ textContent: 'Free' }];
          let idx = 0;
          return { nextNode: () => (idx < items.length ? items[idx++] : null) };
        }
      };

      const matched = mp_getBlockedPrices({}, VARS, mockDoc);
      expect(matched).toBe('free');
    });
  });
});
