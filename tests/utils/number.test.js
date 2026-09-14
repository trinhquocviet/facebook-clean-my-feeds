import { describe, test, expect } from 'bun:test';
import { getFullNumber } from '../../src/utils/number.js';

describe('utils/number', () => {
  describe('getFullNumber', () => {
    test('parses plain integer strings', () => {
      expect(getFullNumber('323')).toBe(323);
      expect(getFullNumber('0')).toBe(0);
      expect(getFullNumber('999')).toBe(999);
    });

    test('parses numeric values directly', () => {
      expect(getFullNumber(500)).toBe(500);
      expect(getFullNumber(1250.6)).toBe(1251);
    });

    test('parses "K" (thousands) values with dot and comma decimals', () => {
      expect(getFullNumber('1K')).toBe(1000);
      expect(getFullNumber('1.2K')).toBe(1200);
      expect(getFullNumber('1,2K')).toBe(1200);
      expect(getFullNumber('1.25K')).toBe(1250);
      expect(getFullNumber('15K')).toBe(15000);
      expect(getFullNumber('25.5K')).toBe(25500);
    });

    test('parses "M" (millions) values with dot and comma decimals', () => {
      expect(getFullNumber('1M')).toBe(1000000);
      expect(getFullNumber('1.4M')).toBe(1400000);
      expect(getFullNumber('1,4M')).toBe(1400000);
      expect(getFullNumber('2.75M')).toBe(2750000);
      expect(getFullNumber('10M')).toBe(10000000);
    });

    test('handles whitespace and lowercase suffixes', () => {
      expect(getFullNumber('  1.5k  ')).toBe(1500);
      expect(getFullNumber('  2.3m  ')).toBe(2300000);
    });

    test('handles edge cases safely without NaN', () => {
      expect(getFullNumber('')).toBe(0);
      expect(getFullNumber('   ')).toBe(0);
      expect(getFullNumber(null)).toBe(0);
      expect(getFullNumber(undefined)).toBe(0);
      expect(getFullNumber('notanumber')).toBe(0);
    });
  });
});
