import { describe, test, expect } from 'bun:test';
import {
  cleanText,
  sanitizeReason,
  generateRandomString,
  findFirstMatch,
  findFirstMatchRegExp
} from '../../src/utils/text.js';

describe('utils/text', () => {
  describe('cleanText', () => {
    test('normalizes non-breaking space (ASCII 160) into standard space', () => {
      const input = 'Sponsored\u00A0Post';
      const output = cleanText(input);
      expect(output).toBe('Sponsored Post');
    });

    test('normalizes stylized unicode mathematical alphanumeric characters', () => {
      // 𝐒𝐩𝐨𝐧𝐬𝐨𝐫𝐞𝐝 in mathematical bold
      const styled = '𝐒𝐩𝐨𝐧𝐬𝐨𝐫𝐞𝐝';
      expect(cleanText(styled)).toBe('Sponsored');
    });

    test('returns empty string for non-string inputs', () => {
      expect(cleanText(null)).toBe('');
      expect(cleanText(undefined)).toBe('');
      expect(cleanText(123)).toBe('');
      expect(cleanText({})).toBe('');
    });
  });

  describe('sanitizeReason', () => {
    test('removes double quotes from strings', () => {
      expect(sanitizeReason('Post blocked: "Sponsored" content')).toBe('Post blocked: Sponsored content');
      expect(sanitizeReason('"Clean" "My" "Feeds"')).toBe('Clean My Feeds');
    });

    test('returns unchanged if no quotes present', () => {
      expect(sanitizeReason('Clean text')).toBe('Clean text');
    });

    test('returns empty string for non-string input', () => {
      expect(sanitizeReason(null)).toBe('');
      expect(sanitizeReason(undefined)).toBe('');
      expect(sanitizeReason(42)).toBe('');
    });
  });

  describe('generateRandomString', () => {
    test('generates string of default length 13', () => {
      const str = generateRandomString();
      expect(str).toHaveLength(13);
      expect(/^[A-Za-z][A-Za-z0-9]{12}$/.test(str)).toBe(true);
    });

    test('generates string of custom specified length', () => {
      const str = generateRandomString(8);
      expect(str).toHaveLength(8);
      expect(/^[A-Za-z][A-Za-z0-9]{7}$/.test(str)).toBe(true);
    });

    test('ensures first character is always an alphabet letter', () => {
      for (let i = 0; i < 50; i++) {
        const str = generateRandomString(10);
        const firstChar = str.charAt(0);
        expect(/^[A-Za-z]$/.test(firstChar)).toBe(true);
      }
    });

    test('returns empty string for invalid lengths', () => {
      expect(generateRandomString(0)).toBe('');
      expect(generateRandomString(-5)).toBe('');
      expect(generateRandomString('invalid')).toBe('');
    });
  });

  describe('findFirstMatch', () => {
    test('returns the first matching search term', () => {
      const text = 'Check out this brand new sponsored promotion today';
      const terms = ['discount', 'sponsored', 'brand'];
      expect(findFirstMatch(text, terms)).toBe('sponsored');
    });

    test('returns empty string when no terms match', () => {
      const text = 'Hello world';
      const terms = ['sponsored', 'suggested'];
      expect(findFirstMatch(text, terms)).toBe('');
    });

    test('returns empty string for empty inputs', () => {
      expect(findFirstMatch('', ['test'])).toBe('');
      expect(findFirstMatch('test', [])).toBe('');
      expect(findFirstMatch(null, ['test'])).toBe('');
      expect(findFirstMatch('test', null)).toBe('');
    });
  });

  describe('findFirstMatchRegExp', () => {
    test('matches case-insensitively and returns matching pattern string', () => {
      const text = 'Special SPONSORED offer for you';
      const patterns = ['^breaking', 'sponsored'];
      expect(findFirstMatchRegExp(text, patterns)).toBe('sponsored');
    });

    test('supports complex regular expressions', () => {
      const text = 'Shared with 25 members';
      const patterns = ['shared\\s+with\\s+\\d+', 'sponsored'];
      expect(findFirstMatchRegExp(text, patterns)).toBe('shared\\s+with\\s+\\d+');
    });

    test('safely handles invalid/malformed regex without throwing', () => {
      const text = 'Some sample text';
      const patterns = ['[invalid(regex', 'sample'];
      expect(findFirstMatchRegExp(text, patterns)).toBe('sample');
    });

    test('returns empty string if no pattern matches', () => {
      expect(findFirstMatchRegExp('Normal post text', ['^sponsored', '^ad$'])).toBe('');
    });
  });
});
