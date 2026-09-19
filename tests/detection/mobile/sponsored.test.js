import { describe, it, expect } from 'bun:test';
import { m_isSponsored } from '@/modules/detection/mobile/sponsored.js';

describe('modules/detection/mobile/sponsored', () => {
  const KeyWords = {
    SPONSORED: 'Sponsored',
    MOBILE_AD_LABELS: ['Ad', 'Được tài trợ']
  };

  it('detects Ad when header subtitle contains literal "Ad"', () => {
    const subtitleSpan = { textContent: 'Ad' };
    const cell = {
      querySelector: () => null,
      querySelectorAll: () => [subtitleSpan]
    };

    expect(m_isSponsored(cell, KeyWords)).toBe('Sponsored');
  });

  it('detects Ad when text has trailing icon glyphs like "Ad 󰞋󱙷"', () => {
    const subtitleSpan = { textContent: 'Ad 󰞋󱙷' };
    const cell = {
      querySelector: () => null,
      querySelectorAll: () => [subtitleSpan]
    };

    expect(m_isSponsored(cell, KeyWords)).toBe('Sponsored');
  });

  it('detects Ad in Vietnamese locale "Được tài trợ"', () => {
    const subtitleSpan = { textContent: 'Được tài trợ' };
    const cell = {
      querySelector: () => null,
      querySelectorAll: () => [subtitleSpan]
    };

    expect(m_isSponsored(cell, KeyWords)).toBe('Sponsored');
  });

  it('returns empty string for organic post with real timestamp subtitle', () => {
    const subtitleSpan = { textContent: '‎2h‎' };
    const cell = {
      querySelector: () => null,
      querySelectorAll: () => [subtitleSpan]
    };

    expect(m_isSponsored(cell, KeyWords)).toBe('');
  });

  it('returns empty string for null or empty cell', () => {
    expect(m_isSponsored(null, KeyWords)).toBe('');
    expect(m_isSponsored({}, KeyWords)).toBe('');
  });
});
