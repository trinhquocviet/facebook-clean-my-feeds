import { describe, it, expect, beforeEach } from 'bun:test';
import {
  setFeedSettings,
  registerRedirToMostRecent,
  stopTrackingDirtIntoMyHouse
} from '@/modules/feed-router/index.js';
import { createInitialState } from '@/state/index.js';

describe('modules/feed-router', () => {
  let VARS;
  let mockWindow;
  let mockDoc;

  beforeEach(() => {
    VARS = createInitialState();
    mockWindow = {
      location: {
        href: 'https://www.facebook.com/',
        pathname: '/',
        search: '',
        origin: 'https://www.facebook.com'
      }
    };
    mockDoc = {
      querySelectorAll: () => []
    };
  });

  describe('setFeedSettings', () => {
    it('detects news feed on root path', () => {
      const changed = setFeedSettings({ VARS, windowObj: mockWindow, doc: mockDoc });
      expect(changed).toBe(true);
      expect(VARS.isNF).toBe(true);
      expect(VARS.isGF).toBe(false);
      expect(VARS.isAF).toBe(true);
    });

    it('detects groups-recent when on root with filter=groups', () => {
      mockWindow.location.search = '?filter=groups';
      setFeedSettings({ VARS, windowObj: mockWindow, doc: mockDoc });
      expect(VARS.isNF).toBe(false);
      expect(VARS.isGF).toBe(true);
      expect(VARS.gfType).toBe('groups-recent');
    });

    it('detects groups feed on /groups/ paths', () => {
      mockWindow.location.pathname = '/groups/feed';
      setFeedSettings({ VARS, windowObj: mockWindow, doc: mockDoc });
      expect(VARS.isGF).toBe(true);
      expect(VARS.gfType).toBe('groups');
    });

    it('detects watch feed on /watch paths', () => {
      mockWindow.location.pathname = '/watch';
      setFeedSettings({ VARS, windowObj: mockWindow, doc: mockDoc });
      expect(VARS.isVF).toBe(true);
      expect(VARS.vfType).toBe('videos');
    });

    it('detects marketplace and invokes callback', () => {
      mockWindow.location.pathname = '/marketplace';
      let mpCalled = false;
      setFeedSettings({
        VARS,
        windowObj: mockWindow,
        doc: mockDoc,
        onMarketplaceEnter: () => { mpCalled = true; }
      });
      expect(VARS.isMF).toBe(true);
      expect(mpCalled).toBe(true);
    });

    it('detects search feed on /search/top/', () => {
      mockWindow.location.pathname = '/search/top/';
      setFeedSettings({ VARS, windowObj: mockWindow, doc: mockDoc });
      expect(VARS.isSF).toBe(true);
    });

    it('detects reels feed on /reel/ path', () => {
      mockWindow.location.pathname = '/reel/12345';
      VARS.Options.REELS_CONTROLS = true;
      setFeedSettings({ VARS, windowObj: mockWindow, doc: mockDoc });
      expect(VARS.isRF).toBe(true);
    });

    it('detects profile page on /profile.php', () => {
      mockWindow.location.pathname = '/profile.php';
      setFeedSettings({ VARS, windowObj: mockWindow, doc: mockDoc });
      expect(VARS.isPP).toBe(true);
    });

    it('returns false if URL has not changed and forceUpdate is false', () => {
      setFeedSettings({ VARS, windowObj: mockWindow, doc: mockDoc });
      const secondCall = setFeedSettings({ VARS, windowObj: mockWindow, doc: mockDoc });
      expect(secondCall).toBe(false);

      const forcedCall = setFeedSettings({ VARS, windowObj: mockWindow, doc: mockDoc, forceUpdate: true });
      expect(forcedCall).toBe(true);
    });
  });

  describe('registerRedirToMostRecent', () => {
    it('redirects when enabled and on home root', () => {
      VARS.Options.NF_AUTO_REDIR_TO_MOST_RECENT = true;
      registerRedirToMostRecent({ VARS, windowObj: mockWindow });
      expect(mockWindow.location.href).toBe('https://www.facebook.com/?sk=h_chr');
    });

    it('does not redirect when option is disabled', () => {
      VARS.Options.NF_AUTO_REDIR_TO_MOST_RECENT = false;
      registerRedirToMostRecent({ VARS, windowObj: mockWindow });
      expect(mockWindow.location.href).toBe('https://www.facebook.com/');
    });
  });

  describe('stopTrackingDirtIntoMyHouse', () => {
    it('strips ?ref from tracking links', () => {
      const links = [
        { href: 'https://www.facebook.com/item/123/?ref=product_tab' }
      ];
      const doc = {
        querySelectorAll: () => links
      };
      stopTrackingDirtIntoMyHouse(doc);
      expect(links[0].href).toBe('https://www.facebook.com/item/123');
    });
  });
});
