import { describe, it, expect } from 'bun:test';
import { m_isSuggestedFollow } from '@/modules/detection/mobile/suggested-follow.js';

describe('modules/detection/mobile/suggested-follow', () => {
  const KeyWords = {
    NF_FOLLOW: 'Suggested: Follow',
    MOBILE_FOLLOW_LABELS: ['Follow', 'Theo dõi']
  };

  it('detects suggested post when header contains "Follow" button', () => {
    const followBtn = { textContent: 'Follow' };
    const cell = {
      querySelector: () => null,
      querySelectorAll: () => [followBtn]
    };

    expect(m_isSuggestedFollow(cell, KeyWords)).toBe('Suggested: Follow');
  });

  it('detects suggested post in Vietnamese locale "Theo dõi"', () => {
    const followBtn = { textContent: 'Theo dõi' };
    const cell = {
      querySelector: () => null,
      querySelectorAll: () => [followBtn]
    };

    expect(m_isSuggestedFollow(cell, KeyWords)).toBe('Suggested: Follow');
  });

  it('returns empty string for organic followed post with no Follow button', () => {
    const likeBtn = { textContent: 'Like' };
    const cell = {
      querySelector: () => null,
      querySelectorAll: () => [likeBtn]
    };

    expect(m_isSuggestedFollow(cell, KeyWords)).toBe('');
  });

  it('returns empty string for null or empty cell', () => {
    expect(m_isSuggestedFollow(null, KeyWords)).toBe('');
    expect(m_isSuggestedFollow({}, KeyWords)).toBe('');
  });
});
