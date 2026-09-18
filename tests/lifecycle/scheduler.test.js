import { describe, it, expect } from 'bun:test';
import { calculateSleepDuration, createScheduler } from '@/modules/lifecycle/index.js';

describe('modules/lifecycle', () => {
  describe('calculateSleepDuration', () => {
    it('returns adaptive sleep duration based on noChangeCounter', () => {
      expect(calculateSleepDuration(0)).toBe(50);
      expect(calculateSleepDuration(15)).toBe(50);
      expect(calculateSleepDuration(16)).toBe(75);
      expect(calculateSleepDuration(30)).toBe(75);
      expect(calculateSleepDuration(31)).toBe(100);
      expect(calculateSleepDuration(45)).toBe(100);
      expect(calculateSleepDuration(46)).toBe(150);
      expect(calculateSleepDuration(60)).toBe(150);
      expect(calculateSleepDuration(61)).toBe(1000);
      expect(calculateSleepDuration(200)).toBe(1000);
    });
  });

  describe('createScheduler', () => {
    it('dispatches to News Feed cleaner when isNF is true', () => {
      let newsFeedCleaned = false;
      let setFeedSettingsCalled = false;

      const VARS = {
        isNF: true, isGF: false, isVF: false, isMF: false, isSF: false, isRF: false, isPP: false,
        isAF: true, noChangeCounter: 5
      };

      const scheduler = createScheduler({
        VARS,
        setFeedSettings: () => { setFeedSettingsCalled = true; },
        cleaners: { mopUpTheNewsFeed: () => { newsFeedCleaned = true; } },
        windowObj: { scrollY: 0, setTimeout: () => 1, clearTimeout: () => {}, location: { href: 'https://www.facebook.com/' } }
      });

      scheduler.processPage('url-changed');
      expect(setFeedSettingsCalled).toBe(true);
      expect(newsFeedCleaned).toBe(true);
    });

    it('dispatches to Groups, Watch, Marketplace, Search, Reels, and Profile cleaners', () => {
      const feeds = [
        { flag: 'isGF', method: 'mopUpTheGroupsFeed' },
        { flag: 'isVF', method: 'mopUpTheWatchVideosFeed' },
        { flag: 'isMF', method: 'mopUpTheMarketplaceFeed' },
        { flag: 'isSF', method: 'mopUpTheSearchFeed' },
        { flag: 'isRF', method: 'mopUpTheReelFeed' },
        { flag: 'isPP', method: 'mopUpTheProfilePage' },
      ];

      for (const { flag, method } of feeds) {
        let called = false;
        const VARS = {
          isNF: false, isGF: false, isVF: false, isMF: false, isSF: false, isRF: false, isPP: false,
          isAF: true, noChangeCounter: 0, [flag]: true
        };

        const cleaners = {
          [method]: () => { called = true; }
        };

        const scheduler = createScheduler({
          VARS,
          setFeedSettings: () => {},
          cleaners,
          windowObj: { scrollY: 0, setTimeout: () => 1, clearTimeout: () => {}, location: { href: 'https://www.facebook.com/' } }
        });

        scheduler.processPage('scrolling');
        expect(called).toBe(true);
      }
    });

    it('manages event listeners on start() and cleanup on stop()', () => {
      const listeners = {};
      let intervalCleared = false;
      let timeoutCleared = false;
      let intervalFn = null;

      const mockWindow = {
        scrollY: 0,
        addEventListener: (event, handler) => {
          listeners[event] = handler;
        },
        setInterval: (fn) => {
          intervalFn = fn;
          return 123;
        },
        clearInterval: (id) => {
          if (id === 123) intervalCleared = true;
        },
        setTimeout: () => 456,
        clearTimeout: (id) => {
          if (id === 456) timeoutCleared = true;
        },
        location: { href: 'https://www.facebook.com/' }
      };

      const VARS = {
        isNF: true, isGF: false, isVF: false, isMF: false, isSF: false, isRF: false, isPP: false,
        isAF: true, noChangeCounter: 0, prevURL: 'https://www.facebook.com/'
      };

      const scheduler = createScheduler({
        VARS,
        setFeedSettings: () => {},
        cleaners: { mopUpTheNewsFeed: () => {} },
        windowObj: mockWindow
      });

      scheduler.start();
      expect(typeof listeners.scroll).toBe('function');
      expect(typeof listeners.popstate).toBe('function');
      expect(typeof intervalFn).toBe('function');

      // Scroll trigger
      mockWindow.scrollY = 50;
      listeners.scroll();

      // URL change trigger in interval
      VARS.prevURL = 'https://www.facebook.com/old';
      intervalFn();

      scheduler.stop();
      expect(intervalCleared).toBe(true);
      expect(timeoutCleared).toBe(true);
    });
  });
});
