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
        // Ensure no literal newlines in styles
        expect(rule.styles).not.toContain('\n');
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
    test('returns array of dialog CSS rules without newlines', () => {
      const rules = getDialogRules(dummyVars);
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(20);

      for (const rule of rules) {
        expect(typeof rule.selector).toBe('string');
        expect(typeof rule.styles).toBe('string');
        expect(rule.styles).not.toContain('\n');
      }

      const dialogMain = rules.find(r => r.selector === '.fb-cmf');
      expect(dialogMain).toBeDefined();
      expect(dialogMain.styles).toMatch(/position:\s*fixed/);
      expect(dialogMain.styles).toContain('background-color: var(--card-background)');
      expect(dialogMain.styles).toContain('transform: translateY(6px) scale(.98)');
      expect(dialogMain.styles).toContain('transition: transform .16s cubic-bezier(.2,0,.2,1)');
    });

    test('interpolates iconNewWindowClass and showAtt variables in selectors', () => {
      const rules = getDialogRules(dummyVars);
      const iconRule = rules.find(r => r.selector === `.${dummyVars.iconNewWindowClass}`);
      expect(iconRule).toBeDefined();
      expect(iconRule.styles).toContain('width: 1rem');

      const showRule = rules.find(r => r.selector === `.fb-cmf[${dummyVars.showAtt}]`);
      expect(showRule).toBeDefined();
      expect(showRule.styles).toContain('opacity: 1');
      expect(showRule.styles).toContain('transform: none');
    });

    test('includes footer button styles in dialog rules', () => {
      const rules = getDialogRules(dummyVars);
      const btnBase = rules.find(r => r.selector.includes('.cmf-btn'));
      expect(btnBase).toBeDefined();
      expect(btnBase.styles).toContain('cursor: pointer');

      const btnPrimary = rules.find(r => r.selector.includes('.cmf-btn--primary'));
      expect(btnPrimary).toBeDefined();
      expect(btnPrimary.styles).toContain('var(--cmf-accent');

      const btnSecondary = rules.find(r => r.selector.includes('.cmf-btn--secondary'));
      expect(btnSecondary).toBeDefined();

      const btnGhost = rules.find(r => r.selector.includes('.cmf-btn--ghost'));
      expect(btnGhost).toBeDefined();
    });

    test('does not contain obsolete legacy fieldset fallback rules', () => {
      const rules = getDialogRules(dummyVars);
      const fieldsetRule = rules.find(r => r.selector.includes('.fb-cmf fieldset'));
      expect(fieldsetRule).toBeUndefined();
    });

    test('contains pure CSS dark mode rules supporting Facebook classes and media queries', () => {
      const rules = getDialogRules(dummyVars);
      const darkSchemeRule = rules.find(r => r.selector.includes('.__fb-dark-mode .fb-cmf') && r.selector.includes('[data-theme="dark"] .fb-cmf'));
      expect(darkSchemeRule).toBeDefined();
      expect(darkSchemeRule.styles).toContain('color-scheme: dark');

      const darkInputsRule = rules.find(r => r.selector.includes('.__fb-dark-mode .fb-cmf .cmf-textarea') && r.selector.includes('[data-theme="dark"] .fb-cmf .cmf-textarea'));
      expect(darkInputsRule).toBeDefined();
      expect(darkInputsRule.styles).toContain('background-color: var(--card-background, #242526)');
      expect(darkInputsRule.styles).toContain('color: var(--primary-text, #e4e6eb)');

      const mediaDarkRule = rules.find(r => r.selector.includes('@media (prefers-color-scheme: dark)'));
      expect(mediaDarkRule).toBeDefined();
      expect(mediaDarkRule.styles).toContain('color-scheme: dark');
    });
  });

  describe('getToggleRules', () => {
    test('returns array of toggle and position rules without newlines', () => {
      const rules = getToggleRules(dummyVars);
      expect(Array.isArray(rules)).toBe(true);

      for (const rule of rules) {
        expect(typeof rule.selector).toBe('string');
        expect(typeof rule.styles).toBe('string');
        expect(rule.styles).not.toContain('\n');
      }

      const posBottomLeft = rules.find(r => r.selector.includes('bottom-left'));
      expect(posBottomLeft).toBeDefined();

      const posTopRight = rules.find(r => r.selector.includes('top-right'));
      expect(posTopRight).toBeDefined();

      const dlgRight = rules.find(r => r.selector.includes('data-cmf-dlg="right"'));
      expect(dlgRight).toBeDefined();
    });

    test('does not contain dialog transitions or footer button rules', () => {
      const rules = getToggleRules(dummyVars);
      const dialogTransition = rules.find(r => r.selector === '.fb-cmf');
      expect(dialogTransition).toBeUndefined();

      const footerBtn = rules.find(r => r.selector.includes('.cmf-btn'));
      expect(footerBtn).toBeUndefined();
    });
  });
});

