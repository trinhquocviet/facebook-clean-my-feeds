import { describe, it, expect, beforeEach } from 'bun:test';
import {
  isSponsored,
  nf_isSponsored_Plain,
  nf_isSponsored_xlink,
  nf_isSponsored_ShadowRoot1,
  nf_isSponsored_ShadowRoot2,
  resetSponsoredXlinkCache
} from '@/modules/detection/sponsored.js';
import { createInitialState } from '@/state/index.js';

describe('modules/detection/sponsored', () => {
  let VARS;

  beforeEach(() => {
    VARS = createInitialState();
    VARS.isNF = true;
    VARS.dictionarySponsored = ['sponsored', 'được tài trợ', 'gesponsert'];
    resetSponsoredXlinkCache();
  });

  describe('nf_isSponsored_Plain', () => {
    it('detects plain sponsored text when span does not contain svg', () => {
      const mockPost = {
        querySelectorAll: (sel) => {
          if (sel.includes('div[id] > span > a[role="link"] > span')) {
            return [
              {
                querySelector: (s) => (s === 'svg' ? null : null),
                textContent: ' Sponsored '
              }
            ];
          }
          return [];
        }
      };

      expect(nf_isSponsored_Plain(mockPost, VARS)).toBe(true);
    });

    it('returns false when text is not in sponsored dictionary', () => {
      const mockPost = {
        querySelectorAll: () => [
          {
            querySelector: () => null,
            textContent: ' Public Post '
          }
        ]
      };

      expect(nf_isSponsored_Plain(mockPost, VARS)).toBe(false);
    });
  });

  describe('nf_isSponsored_xlink', () => {
    it('detects indirect xlink to sponsored SVG and caches id', () => {
      const mockSvg = {
        id: 'svg_indirect_1',
        querySelector: (sel) => {
          if (sel === 'use') {
            return {
              getAttribute: (attr) => (attr === 'xlink:href' ? '#target_text_1' : null)
            };
          }
          return null;
        }
      };

      const mockTextEl = {
        id: 'target_text_1',
        tagName: 'text',
        textContent: 'Sponsored',
        querySelector: () => null
      };

      const mockDoc = {
        querySelectorAll: (sel) => (sel === 'svg[id]' ? [mockSvg] : []),
        getElementById: (id) => (id === 'target_text_1' ? mockTextEl : null)
      };

      const mockPost = {
        querySelector: (sel) => sel.includes('svg_indirect_1')
      };

      expect(nf_isSponsored_xlink(mockPost, VARS, mockDoc)).toBe(true);
    });
  });

  describe('isSponsored', () => {
    it('returns true when plain detection matches on News Feed', () => {
      const mockPost = {
        querySelector: () => null,
        querySelectorAll: (sel) => {
          if (sel.includes('div[id] > span > a[role="link"] > span')) {
            return [
              {
                querySelector: () => null,
                textContent: 'Sponsored'
              }
            ];
          }
          return [];
        }
      };

      expect(isSponsored(mockPost, VARS)).toBe(true);
    });

    it('detects structural __cft__ parameter length heuristic', () => {
      VARS.isNF = false;
      VARS.isGF = true;

      const longLink = 'https://www.facebook.com/ad/?__cft__[0]=' + 'x'.repeat(350);
      const mockPost = {
        querySelector: () => null,
        querySelectorAll: (sel) => {
          if (sel.includes('__cft__[0]=')) {
            return [{ href: longLink }];
          }
          return [];
        }
      };

      expect(isSponsored(mockPost, VARS)).toBe(true);
    });
  });
});
