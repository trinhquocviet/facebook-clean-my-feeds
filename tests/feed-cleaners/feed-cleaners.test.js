import { describe, it, expect, beforeEach } from 'bun:test';
import {
  mopUpTheNewsFeed,
  mopUpTheGroupsFeed,
  mopUpTheWatchVideosFeed,
  mopUpTheMarketplaceFeed,
  mopUpTheSearchFeed,
  mopUpTheReelFeed,
  mopUpTheProfilePage,
  mp_hideBox,
  mp_stopTrackingDirtIntoMyHouse,
  mp_hideSponsoredItems
} from '@/modules/feed-cleaners/index.js';
import { mainColumnAtt, postAtt, postAttMPSkip, rvAtt } from '@/constants/index.js';

describe('modules/feed-cleaners', () => {
  let VARS;
  let KeyWords;

  beforeEach(() => {
    VARS = {
      Options: {
        NF_SPONSORED: true,
        NF_SUGGESTIONS: true,
        GF_SPONSORED: true,
        VF_SPONSORED: true,
        MP_SPONSORED: true,
        NF_BLOCKED_ENABLED: false,
        GLOBAL_BLOCKED_ENABLED: false,
        VERBOSITY_DEBUG: false,
        REELS_CONTROLS: true,
        REELS_DISABLE_LOOPING: true
      },
      hideWithNoCaptionAtt: 'data-hidden',
      showAtt: 'data-show',
      hideAnInfoBox: false,
      echoCount: 0,
      noChangeCounter: 0,
      gfType: 'groups',
      vfType: 'videos',
      mpType: 'marketplace',
      isRF: true,
      isRF_InTimeoutMode: false,
      isChromium: false
    };

    KeyWords = {
      SPONSORED: 'Sponsored',
      NF_SUGGESTIONS: 'Suggestions'
    };
  });

  describe('mopUpTheNewsFeed', () => {
    it('returns early when isTheHouseDirty returns [null, null]', () => {
      let postsQueried = false;
      mopUpTheNewsFeed({
        VARS,
        KeyWords,
        postObscurer: {},
        isTheHouseDirty: () => [null, null],
        doc: {
          querySelectorAll: () => {
            postsQueried = true;
            return [];
          }
        }
      });
      expect(postsQueried).toBe(false);
    });

    it('processes dirty news feed, runs classification and hides detected posts', () => {
      const mockMainColumn = {
        innerHTML: 'content',
        setAttribute: () => {}
      };
      const mockPost = {
        innerHTML: '<div>Post</div>',
        querySelector: (sel) => {
          if (sel && sel.includes('/friends/')) return { role: 'link' };
          return null;
        },
        querySelectorAll: (sel) => {
          if (sel && sel.includes('/friends/')) return [{ role: 'link' }];
          return [];
        }
      };
      let hiddenPost = null;
      let hiddenReason = null;

      const mockDoc = {
        querySelectorAll: () => [mockPost],
        querySelector: () => null
      };

      mopUpTheNewsFeed({
        VARS: { ...VARS, Options: { ...VARS.Options, NF_PEOPLE_YOU_MAY_KNOW: true } },
        KeyWords: { ...KeyWords, NF_PEOPLE_YOU_MAY_KNOW: 'People You May Know' },
        isTheHouseDirty: () => [mockMainColumn, null],
        postObscurer: {
          nf_isPostAlreadyHidden: () => false,
          nf_hidePost: (p, r) => {
            hiddenPost = p;
            hiddenReason = r;
          },
          hideFeature: () => {},
          hideBlock: () => {}
        },
        doc: mockDoc
      });

      expect(hiddenPost).toBe(mockPost);
      expect(hiddenReason).toBe('People You May Know');
    });
  });

  describe('mopUpTheGroupsFeed', () => {
    it('returns early when gf_isTheHouseDirty returns [null, null]', () => {
      let cleanConsoleCalled = false;
      mopUpTheGroupsFeed({
        VARS,
        KeyWords,
        gf_isTheHouseDirty: () => [null, null],
        gf_cleanTheConsoleTable: () => {
          cleanConsoleCalled = true;
        }
      });
      expect(cleanConsoleCalled).toBe(false);
    });
  });

  describe('mopUpTheMarketplaceFeed & helpers', () => {
    it('mp_hideBox stamps rejection attribute', () => {
      const setAttrs = {};
      const mockBox = {
        setAttribute: (k, v) => {
          setAttrs[k] = v;
        }
      };
      mp_hideBox(mockBox, 'Blocked Text', VARS);
      expect(setAttrs['data-hidden']).toBe('');
      expect(setAttrs[postAtt]).toBe('Blocked Text');
    });

    it('mp_stopTrackingDirtIntoMyHouse strips ?ref from links', () => {
      const mockLink = { href: 'https://facebook.com/item/123/?ref=product_shelf' };
      const mockDoc = {
        querySelectorAll: (sel) => (sel.includes('/?ref=') ? [mockLink] : [])
      };
      mp_stopTrackingDirtIntoMyHouse(mockDoc);
      expect(mockLink.href).toBe('https://facebook.com/item/123');
    });
  });

  describe('mopUpTheSearchFeed', () => {
    it('returns early if search feed is not dirty', () => {
      let queryCalled = false;
      const mockDoc = {
        querySelectorAll: () => {
          queryCalled = true;
          return [];
        }
      };
      mopUpTheSearchFeed(
        {
          VARS,
          KeyWords,
          sf_isTheHouseDirty: () => null
        },
        mockDoc
      );
      expect(queryCalled).toBe(false);
    });
  });

  describe('mopUpTheProfilePage', () => {
    it('returns early if no profile filter options are enabled', () => {
      VARS.Options.PP_BLOCKED_ENABLED = false;
      VARS.Options.GLOBAL_BLOCKED_ENABLED = false;
      VARS.Options.PP_ANIMATED_GIFS_POSTS = false;
      VARS.Options.PP_ANIMATED_GIFS_PAUSE = false;

      let houseDirtyCalled = false;
      mopUpTheProfilePage({
        VARS,
        pp_isTheHouseDirty: () => {
          houseDirtyCalled = true;
          return [null, null];
        }
      });
      expect(houseDirtyCalled).toBe(false);
    });
  });

  describe('createFeedCleaners', () => {
    it('instantiates all cleaner methods and helpers bound to state', () => {
      const { createFeedCleaners } = require('@/modules/feed-cleaners/index.js');
      const cleaners = createFeedCleaners({
        VARS,
        getKeyWords: () => KeyWords,
        masterKeyWords: {},
        postObscurer: {
          nf_isPostAlreadyHidden: () => false,
          hideFeature: () => {},
          gf_hidePost: () => {},
          vf_hidePost: () => {},
          nf_hidePost: () => {},
          hideBlock: () => {}
        },
        dirtyChecker: {
          isTheHouseDirty: () => [null, null],
          gf_isTheHouseDirty: () => [null, null],
          vf_isTheHouseDirty: () => [null, null],
          mp_isTheHouseDirty: () => null,
          sf_isTheHouseDirty: () => null,
          pp_isTheHouseDirty: () => [null, null]
        }
      });

      expect(typeof cleaners.mopUpTheNewsFeed).toBe('function');
      expect(typeof cleaners.mopUpTheGroupsFeed).toBe('function');
      expect(typeof cleaners.mopUpTheWatchVideosFeed).toBe('function');
      expect(typeof cleaners.mopUpTheMarketplaceFeed).toBe('function');
      expect(typeof cleaners.mopUpTheSearchFeed).toBe('function');
      expect(typeof cleaners.mopUpTheReelFeed).toBe('function');
      expect(typeof cleaners.mopUpTheProfilePage).toBe('function');
      expect(typeof cleaners.mp_hideBox).toBe('function');
      expect(typeof cleaners.mp_stopTrackingDirtIntoMyHouse).toBe('function');
      expect(typeof cleaners.mp_hideSponsoredItems).toBe('function');

      // Calling mopUpTheNewsFeed with null dirty check should safely execute without error
      expect(() => cleaners.mopUpTheNewsFeed()).not.toThrow();
    });
  });
});

