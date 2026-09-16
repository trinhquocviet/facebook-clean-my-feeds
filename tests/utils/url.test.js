import { describe, test, expect } from 'bun:test';
import { getVideoPublisherPathFromURL } from '@/utils/url.js';

describe('utils/url', () => {
  describe('getVideoPublisherPathFromURL', () => {
    test('extracts canonical publisher URL from /watch/ link with query params', () => {
      const url = 'https://www.facebook.com/watch/accesshollywood/?__cft__[0]=AZXwuwSI60vEG7hi&__tn__=%3C';
      const result = getVideoPublisherPathFromURL(url);
      expect(result).toBe('https://www.facebook.com/accesshollywood/');
    });

    test('extracts canonical publisher URL from /watch/ link without query params', () => {
      const url = 'https://www.facebook.com/watch/bbcnews/';
      const result = getVideoPublisherPathFromURL(url);
      expect(result).toBe('https://www.facebook.com/bbcnews/');
    });

    test('returns empty string if URL is not a /watch/ link', () => {
      expect(getVideoPublisherPathFromURL('https://www.facebook.com/groups/12345/')).toBe('');
      expect(getVideoPublisherPathFromURL('https://www.facebook.com/photo.php?fbid=123')).toBe('');
    });

    test('returns empty string for invalid inputs', () => {
      expect(getVideoPublisherPathFromURL('')).toBe('');
      expect(getVideoPublisherPathFromURL(null)).toBe('');
      expect(getVideoPublisherPathFromURL(undefined)).toBe('');
    });
  });
});
