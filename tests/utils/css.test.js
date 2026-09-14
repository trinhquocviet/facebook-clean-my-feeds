import { describe, test, expect } from 'bun:test';
import { buildCssRule } from '../../src/utils/css.js';

describe('utils/css', () => {
  describe('buildCssRule', () => {
    test('formats a single selector and style declaration', () => {
      const result = buildCssRule('.hidden-post', 'display: none');
      expect(result).toBe('.hidden-post {\n    display:none;\n}\n');
    });

    test('formats multiple comma-separated selectors with indentation', () => {
      const selectors = '.post-ad, div[data-ad], .sponsored';
      const styles = 'display: none; visibility: hidden;';
      const result = buildCssRule(selectors, styles);
      expect(result).toBe(
        '.post-ad,\n' +
        'div[data-ad],\n' +
        '.sponsored {\n' +
        '    display:none;\n' +
        '    visibility:hidden;\n' +
        '}\n'
      );
    });

    test('handles declarations with multiple colons (e.g. data URLs or CSS functions)', () => {
      const selectors = '.icon';
      const styles = 'background-image: url("data:image/svg+xml,..."); color: red;';
      const result = buildCssRule(selectors, styles);
      expect(result).toContain('background-image:url("data:image/svg+xml,...")');
      expect(result).toContain('color:red');
    });

    test('returns empty string for invalid or empty inputs', () => {
      expect(buildCssRule('', 'display: none')).toBe('');
      expect(buildCssRule('.test', '')).toBe('');
      expect(buildCssRule(null, undefined)).toBe('');
    });
  });
});
