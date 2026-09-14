import { describe, test, expect } from 'bun:test';
import { isDarkMode, calculateLuminance } from '../../src/utils/theme.js';

describe('utils/theme', () => {
  describe('calculateLuminance', () => {
    test('calculates correct luminance values', () => {
      // White: (255, 255, 255) -> 255
      expect(Math.round(calculateLuminance(255, 255, 255))).toBe(255);
      // Black: (0, 0, 0) -> 0
      expect(calculateLuminance(0, 0, 0)).toBe(0);
      // Dark grey: (36, 37, 38)
      const darkLuminance = calculateLuminance(36, 37, 38);
      expect(darkLuminance).toBeLessThan(128);
    });
  });

  describe('isDarkMode', () => {
    test('returns false when __fb-light-mode class is present', () => {
      const mockDoc = {
        documentElement: {
          classList: {
            contains: (className) => className === '__fb-light-mode'
          }
        }
      };
      expect(isDarkMode(mockDoc)).toBe(false);
    });

    test('returns true when __fb-dark-mode class is present', () => {
      const mockDoc = {
        documentElement: {
          classList: {
            contains: (className) => className === '__fb-dark-mode'
          }
        }
      };
      expect(isDarkMode(mockDoc)).toBe(true);
    });

    test('calculates luminance from body background color when classes are absent', () => {
      const mockDoc = {
        documentElement: {
          classList: {
            contains: () => false
          }
        },
        body: {}
      };
      const mockWin = {
        getComputedStyle: () => ({
          backgroundColor: 'rgb(24, 25, 26)' // Facebook Dark Mode BG
        })
      };

      expect(isDarkMode(mockDoc, mockWin)).toBe(true);

      const mockWinLight = {
        getComputedStyle: () => ({
          backgroundColor: 'rgb(240, 242, 245)' // Facebook Light Mode Wash
        })
      };

      expect(isDarkMode(mockDoc, mockWinLight)).toBe(false);
    });

    test('returns false if document is null or undefined', () => {
      expect(isDarkMode(null)).toBe(false);
    });
  });
});
