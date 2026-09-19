import { describe, it, expect } from 'bun:test';
import { getMobilePostRules } from '@/styles/mobile-post-rules.js';
import { buildStylesheet } from '@/utils/css-builder.js';
import {
  postAtt,
  mobileCollapsedAtt,
  mobileDividerCollapsedAtt,
  mobileSummaryAtt
} from '@/constants/index.js';

describe('styles/mobile-post-rules', () => {
  it('returns valid CSS rule objects with selector and styles', () => {
    const rules = getMobilePostRules({ showAtt: 'cmf-show', hideAtt: 'cmf-hide' });
    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThan(5);

    for (const rule of rules) {
      expect(typeof rule.selector).toBe('string');
      expect(typeof rule.styles).toBe('string');
      expect(rule.selector.length).toBeGreaterThan(0);
      expect(rule.styles.length).toBeGreaterThan(0);
    }
  });

  it('includes height auto !important override rule for mobileCollapsedAtt', () => {
    const rules = getMobilePostRules({ showAtt: 'cmf-show', hideAtt: 'cmf-hide' });
    const heightRule = rules.find((r) => r.selector.includes(mobileCollapsedAtt));
    expect(heightRule).toBeDefined();
    expect(heightRule.styles).toContain('height: auto !important');
  });

  it('includes display none !important for mobileDividerCollapsedAtt', () => {
    const rules = getMobilePostRules({ showAtt: 'cmf-show', hideAtt: 'cmf-hide' });
    const dividerRule = rules.find((r) => r.selector.includes(mobileDividerCollapsedAtt));
    expect(dividerRule).toBeDefined();
    expect(dividerRule.styles).toContain('display: none !important');
  });

  it('includes min-height 48px touch target for mobileSummaryAtt and details[cmfr]', () => {
    const rules = getMobilePostRules({ showAtt: 'cmf-show', hideAtt: 'cmf-hide' });
    const summaryRule = rules.find((r) => r.selector.includes(mobileSummaryAtt));
    expect(summaryRule).toBeDefined();
    expect(summaryRule.styles).toContain('min-height: 48px');
    expect(summaryRule.selector).toContain(`details[${postAtt}].cmf-mobile-details > summary`);
  });

  it('includes active pressed feedback and webkit details marker removal', () => {
    const rules = getMobilePostRules({ showAtt: 'cmf-show', hideAtt: 'cmf-hide' });
    expect(rules.some((r) => r.selector.includes(':active'))).toBe(true);
    expect(rules.some((r) => r.selector.includes('::-webkit-details-marker'))).toBe(true);
  });

  it('successfully compiles into non-empty CSS string via buildStylesheet', () => {
    const rules = getMobilePostRules({ showAtt: 'cmf-show', hideAtt: 'cmf-hide' });
    const css = buildStylesheet(rules, { merge: true });
    expect(css.length).toBeGreaterThan(500);
    expect(css).toContain(`[${mobileCollapsedAtt}] { height: auto !important;`);
    expect(css).toContain(`.cmf-mobile-summary`);
    expect(css).toContain(`details[${postAtt}].cmf-mobile-details`);
  });
});
