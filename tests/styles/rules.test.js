import { describe, test, expect } from 'bun:test';
import {
  getPostHideRules,
  getDialogRules,
  getToggleRules
} from '@/styles/index.js';

describe('styles/index', () => {
  const dummyVars = {
    hideAtt: 'cmfr-hide',
    hideWithNoCaptionAtt: 'cmfr-hide-nocap',
    showAtt: 'cmfr-show',
    cssHideNumberOfShares: 'cmfr-hide-shares',
    iconNewWindowClass: 'cmf-link-new'
  };

  describe('getPostHideRules', () => {
    test('returns array of CSS rule objects with selectors and styles', () => {
      const rules = getPostHideRules(dummyVars);
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(10);

      for (const rule of rules) {
        expect(typeof rule.selector).toBe('string');
        expect(typeof rule.styles).toBe('string');
        expect(rule.selector.length).toBeGreaterThan(0);
        expect(rule.styles.length).toBeGreaterThan(0);
      }
    });

    test('interpolates session attributes correctly', () => {
      const rules = getPostHideRules(dummyVars);
      const hideRule = rules.find(r => r.selector === `div[${dummyVars.hideAtt}]`);
      expect(hideRule).toBeDefined();
      expect(hideRule.styles).toContain('max-height: 0');
    });

    test('preserves Unicode escape sequences for + and -', () => {
      const rules = getPostHideRules(dummyVars);
      const afterRule = rules.find(r => r.selector.includes('summary::after') && r.styles.includes('\\002B'));
      expect(afterRule).toBeDefined();
    });
  });

  describe('getDialogRules', () => {
    test('returns array of dialog CSS rules', () => {
      const rules = getDialogRules(dummyVars);
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(20);

      const dialogMain = rules.find(r => r.selector === '.fb-cmf');
      expect(dialogMain).toBeDefined();
      expect(dialogMain.styles).toContain('position:fixed');
      expect(dialogMain.styles).toContain('background-color: var(--card-background)');
    });
  });

  describe('getToggleRules', () => {
    test('returns array of toggle and position rules', () => {
      const rules = getToggleRules(dummyVars);
      expect(Array.isArray(rules)).toBe(true);

      const posBottomLeft = rules.find(r => r.selector.includes('bottom-left'));
      expect(posBottomLeft).toBeDefined();

      const posTopRight = rules.find(r => r.selector.includes('top-right'));
      expect(posTopRight).toBeDefined();

      const dlgRight = rules.find(r => r.selector.includes('data-cmf-dlg="right"'));
      expect(dlgRight).toBeDefined();
    });
  });
});
