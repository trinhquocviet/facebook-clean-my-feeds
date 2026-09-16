import { describe, test, expect } from 'bun:test';
import { buildStylesheet, objectToCss, compileRules } from '@/utils/css-builder.js';

describe('utils/css-builder', () => {
  describe('objectToCss', () => {
    test('converts camelCase properties to kebab-case CSS', () => {
      const result = objectToCss({
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
        padding: '20px',
        borderRadius: '8px'
      });
      expect(result).toBe('background-color: #1a1a1a; color: #ffffff; padding: 20px; border-radius: 8px;');
    });

    test('preserves CSS custom properties starting with --', () => {
      const result = objectToCss({
        '--cmf-bg': '#ffffff',
        '--cmf-text': '#050505',
        position: 'fixed'
      });
      expect(result).toBe('--cmf-bg: #ffffff; --cmf-text: #050505; position: fixed;');
    });

    test('ignores null, undefined, or empty values', () => {
      const result = objectToCss({
        color: 'red',
        padding: null,
        margin: undefined,
        width: ''
      });
      expect(result).toBe('color: red;');
    });

    test('flattens multiline string styles to single line', () => {
      const result = objectToCss('color: red;\n  margin: 10px;\n');
      expect(result).toBe('color: red; margin: 10px;');
    });

    test('returns empty string for empty input', () => {
      expect(objectToCss(null)).toBe('');
      expect(objectToCss({})).toBe('');
    });
  });

  describe('compileRules', () => {
    test('converts rule objects with style objects into single-line CSS', () => {
      const rules = [
        {
          selector: '.box',
          styles: {
            backgroundColor: '#000',
            borderRadius: '4px'
          }
        },
        {
          selector: '.text',
          styles: 'font-weight: bold;'
        }
      ];
      const compiled = compileRules(rules);
      expect(compiled[0].styles).toBe('background-color: #000; border-radius: 4px;');
      expect(compiled[1].styles).toBe('font-weight: bold;');
    });
  });

  describe('transformStyleObjects (build-time)', () => {
    test('converts styles: { ... } in code into styles: "..."', async () => {
      const { transformStyleObjects } = await import('../../scripts/utils/transform-styles.js');
      const input = `
        const rules = [
          {
            selector: '.card',
            styles: {
              backgroundColor: '#1a1a1a',
              color: '#ffffff',
              padding: '20px',
              borderRadius: '8px'
            }
          }
        ];
      `;
      const output = transformStyleObjects(input);
      expect(output).toContain('styles: "background-color: #1a1a1a; color: #ffffff; padding: 20px; border-radius: 8px;"');
      expect(output).not.toContain('backgroundColor');
    });

    test('handles variable in selector alongside style objects', async () => {
      const { transformStyleObjects } = await import('../../scripts/utils/transform-styles.js');
      const input = `
        {
          selector: \`.\${iconNewWindowClass}\`,
          styles: {
            width: '1rem',
            height: '1rem'
          }
        }
      `;
      const output = transformStyleObjects(input);
      expect(output).toContain('selector: `.${iconNewWindowClass}`');
      expect(output).toContain('styles: "width: 1rem; height: 1rem;"');
    });
  });

  describe('buildStylesheet', () => {
    test('builds stylesheet from rules array', () => {
      const rules = [
        { selector: '.hidden-post', styles: 'display: none;' },
        { selector: '.visible-post', styles: 'display: block;' },
      ];
      const result = buildStylesheet(rules);
      expect(result).toBe('.hidden-post { display: none; }\n.visible-post { display: block; }');
    });

    test('supports style objects inside rules array', () => {
      const rules = [
        { selector: '.card', styles: { backgroundColor: '#fff', padding: '10px' } }
      ];
      const result = buildStylesheet(rules);
      expect(result).toBe('.card { background-color: #fff; padding: 10px; }');
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
        { selector: '.fb-cmf', styles: { backgroundColor: 'white' } },
      ];
      const result = buildStylesheet(rules, { merge: true });
      expect(result).toBe('.fb-cmf { display: flex; background-color: white; }\n.btn { cursor: pointer; }');
    });
  });
});

