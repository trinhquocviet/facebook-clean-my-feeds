import { describe, test, expect } from 'bun:test';
import { buildStylesheet } from '../../src/utils/css-builder.js';

describe('utils/css-builder', () => {
  describe('buildStylesheet', () => {
    test('builds stylesheet from rules array', () => {
      const rules = [
        { selector: '.hidden-post', styles: 'display: none;' },
        { selector: '.visible-post', styles: 'display: block;' },
      ];
      const result = buildStylesheet(rules);
      expect(result).toBe('.hidden-post { display: none; }\n.visible-post { display: block; }');
    });

    test('ignores invalid or empty entries', () => {
      const rules = [
        { selector: '', styles: 'display: none;' },
        { selector: '.valid', styles: '' },
        null,
        { selector: '  .trimmed  ', styles: '  color: red;  ' },
      ];
      const result = buildStylesheet(rules);
      expect(result).toBe('.trimmed { color: red; }');
    });

    test('returns empty string for empty array or non-array', () => {
      expect(buildStylesheet([])).toBe('');
      expect(buildStylesheet(null)).toBe('');
      expect(buildStylesheet(undefined)).toBe('');
    });

    test('supports merge: true to combine styles for duplicate selectors', () => {
      const rules = [
        { selector: '.fb-cmf', styles: 'display: flex;' },
        { selector: '.btn', styles: 'cursor: pointer;' },
        { selector: '.fb-cmf', styles: 'background: white;' },
      ];
      const result = buildStylesheet(rules, { merge: true });
      expect(result).toBe('.fb-cmf { display: flex; background: white; }\n.btn { cursor: pointer; }');
    });
  });
});
