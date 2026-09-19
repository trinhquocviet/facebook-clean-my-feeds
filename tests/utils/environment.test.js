import { describe, it, expect } from 'bun:test';
import { isMobileHost, isMobileDevice, isMobileDOM, isMobileMSite } from '@/utils/index.js';

describe('utils/environment', () => {
  describe('isMobileHost', () => {
    it('returns true for mobile Facebook hostnames', () => {
      const mockDoc = {
        defaultView: {
          location: { hostname: 'm.facebook.com' },
        },
      };
      expect(isMobileHost(mockDoc)).toBe(true);

      const mockTouchDoc = {
        defaultView: {
          location: { hostname: 'touch.facebook.com' },
        },
      };
      expect(isMobileHost(mockTouchDoc)).toBe(true);

      const mockMobileDoc = {
        defaultView: {
          location: { hostname: 'mobile.facebook.com' },
        },
      };
      expect(isMobileHost(mockMobileDoc)).toBe(true);
    });

    it('returns false for desktop Facebook hostnames', () => {
      const mockDesktopDoc = {
        defaultView: {
          location: { hostname: 'www.facebook.com' },
        },
      };
      expect(isMobileHost(mockDesktopDoc)).toBe(false);

      const mockWebDoc = {
        defaultView: {
          location: { hostname: 'web.facebook.com' },
        },
      };
      expect(isMobileHost(mockWebDoc)).toBe(false);

      const mockApexDoc = {
        defaultView: {
          location: { hostname: 'facebook.com' },
        },
      };
      expect(isMobileHost(mockApexDoc)).toBe(false);
    });

    it('returns false safely when document/location is undefined', () => {
      expect(isMobileHost(null)).toBe(false);
      expect(isMobileHost({})).toBe(false);
    });
  });

  describe('isMobileDevice', () => {
    it('returns true if host is mobile Facebook', () => {
      const mockDoc = {
        defaultView: {
          location: { hostname: 'm.facebook.com' },
          navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        },
      };
      expect(isMobileDevice(mockDoc)).toBe(true);
    });

    it('returns true if user-agent indicates a mobile browser', () => {
      const mockIphone = {
        defaultView: {
          location: { hostname: 'www.facebook.com' },
          navigator: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)' },
        },
      };
      expect(isMobileDevice(mockIphone)).toBe(true);

      const mockAndroid = {
        defaultView: {
          location: { hostname: 'www.facebook.com' },
          navigator: { userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7)' },
        },
      };
      expect(isMobileDevice(mockAndroid)).toBe(true);
    });

    it('returns true if matchMedia <= 768px matches', () => {
      const mockNarrowViewport = {
        defaultView: {
          location: { hostname: 'www.facebook.com' },
          navigator: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
          matchMedia: (query) => ({
            matches: query === '(max-width: 768px)',
          }),
        },
      };
      expect(isMobileDevice(mockNarrowViewport)).toBe(true);
    });

    it('returns false on standard desktop environment with wide viewport', () => {
      const mockDesktop = {
        defaultView: {
          location: { hostname: 'www.facebook.com' },
          navigator: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
          matchMedia: () => ({ matches: false }),
        },
      };
      expect(isMobileDevice(mockDesktop)).toBe(false);
    });

    it('returns false safely when doc or navigator is null', () => {
      expect(isMobileDevice(null)).toBe(false);
      expect(isMobileDevice({})).toBe(false);
    });
  });

  describe('isMobileDOM', () => {
    it('returns true when screen-root element is present', () => {
      const mockDoc = {
        getElementById: (id) => (id === 'screen-root' ? { id: 'screen-root' } : null),
        querySelector: () => null
      };
      expect(isMobileDOM(mockDoc)).toBe(true);
    });

    it('returns true when vscroller is present', () => {
      const mockDoc = {
        getElementById: () => null,
        querySelector: (sel) => (sel.includes('vscroller') ? { tagName: 'DIV' } : null)
      };
      expect(isMobileDOM(mockDoc)).toBe(true);
    });

    it('returns false when no mobile DOM markers exist', () => {
      const mockDoc = {
        getElementById: () => null,
        querySelector: () => null
      };
      expect(isMobileDOM(mockDoc)).toBe(false);
      expect(isMobileDOM(null)).toBe(false);
    });
  });

  describe('isMobileMSite', () => {
    it('returns true when host is mobile Facebook', () => {
      const mockDoc = {
        defaultView: { location: { hostname: 'm.facebook.com' } },
        getElementById: () => null,
        querySelector: () => null
      };
      expect(isMobileMSite(mockDoc)).toBe(true);
    });

    it('returns true when DOM has mobile markers', () => {
      const mockDoc = {
        defaultView: { location: { hostname: 'www.facebook.com' } },
        getElementById: (id) => (id === 'screen-root' ? {} : null),
        querySelector: () => null
      };
      expect(isMobileMSite(mockDoc)).toBe(true);
    });

    it('returns false on standard desktop without mobile host or DOM', () => {
      const mockDoc = {
        defaultView: { location: { hostname: 'www.facebook.com' } },
        getElementById: () => null,
        querySelector: () => null
      };
      expect(isMobileMSite(mockDoc)).toBe(false);
    });
  });
});
