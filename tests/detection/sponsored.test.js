import { describe, it, expect, beforeEach } from 'bun:test';
import {
  isSponsored,
  isAdTrackingUrl,
  isSponsored_TrackingUrl,
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

  describe('isAdTrackingUrl', () => {
    it('returns false for null or invalid post element', () => {
      expect(isAdTrackingUrl(null, VARS)).toBe(false);
      expect(isAdTrackingUrl({}, VARS)).toBe(false);
    });

    it('returns true when link in News Feed meets length threshold (>= 311 chars)', () => {
      VARS.isNF = true;
      const longLink = 'https://www.facebook.com/ad/?__cft__[0]=' + 'a'.repeat(311);
      const mockPost = {
        querySelectorAll: (sel) => (sel.includes('__cft__[0]=') ? [{ href: longLink }] : [])
      };
      expect(isAdTrackingUrl(mockPost, VARS)).toBe(true);
    });

    it('returns false when link in News Feed is below length threshold (< 311 chars)', () => {
      VARS.isNF = true;
      const shortLink = 'https://www.facebook.com/ad/?__cft__[0]=' + 'a'.repeat(50);
      const mockPost = {
        querySelectorAll: (sel) => (sel.includes('__cft__[0]=') ? [{ href: shortLink }] : [])
      };
      expect(isAdTrackingUrl(mockPost, VARS)).toBe(false);
    });

    it('uses lower threshold for Watch Videos feed (>= 299 chars)', () => {
      VARS.isNF = false;
      VARS.isVF = true;
      const mediumLink = 'https://www.facebook.com/watch/?__cft__[0]=' + 'b'.repeat(300);
      const mockPost = {
        querySelectorAll: (sel) => (sel.includes('__cft__[0]=') ? [{ href: mediumLink }] : [])
      };
      expect(isAdTrackingUrl(mockPost, VARS)).toBe(true);
    });

    it('uses lower threshold for Search Feed (>= 250 chars)', () => {
      VARS.isNF = false;
      VARS.isSF = true;
      const searchLink = 'https://www.facebook.com/search/?__cft__[0]=' + 'c'.repeat(255);
      const mockPost = {
        querySelectorAll: (sel) => (sel.includes('__cft__[0]=') ? [{ href: searchLink }] : [])
      };
      expect(isAdTrackingUrl(mockPost, VARS)).toBe(true);
    });

    it('returns false when link count is 10 or greater (reshared / embedded post guard)', () => {
      VARS.isNF = true;
      const longLink = 'https://www.facebook.com/ad/?__cft__[0]=' + 'a'.repeat(350);
      const links = Array.from({ length: 10 }, () => ({ href: longLink }));
      const mockPost = {
        querySelectorAll: (sel) => (sel.includes('__cft__[0]=') ? links : [])
      };
      expect(isAdTrackingUrl(mockPost, VARS)).toBe(false);
    });

    it('exports isSponsored_TrackingUrl as an exact alias', () => {
      expect(isSponsored_TrackingUrl).toBe(isAdTrackingUrl);
    });
  });
});
