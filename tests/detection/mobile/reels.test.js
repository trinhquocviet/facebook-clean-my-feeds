import { describe, it, expect } from 'bun:test';
import { m_isReelsTray, m_isSingleReelSuggestion } from '@/modules/detection/mobile/reels.js';

describe('modules/detection/mobile/reels', () => {
  const KeyWords = {
    NF_REELS: 'Reels'
  };

  it('detects Reel card with "View reel video from {Name} with {N} views ."', () => {
    const card = {
      getAttribute: () => 'View reel video from Johnny with 86 thousand views .',
      ariaLabel: 'View reel video from Johnny with 86 thousand views .'
    };
    const cell = {
      querySelector: () => null,
      querySelectorAll: () => [card]
    };

    expect(m_isReelsTray(cell, KeyWords)).toBe('Reels');
    expect(m_isSingleReelSuggestion(cell, KeyWords)).toBe('Reels');
  });

  it('detects Reels shelf with <h2>Reels</h2> header', () => {
    const h2 = { textContent: 'Reels' };
    const cell = {
      querySelector: (sel) => (sel === 'h2' ? h2 : null),
      querySelectorAll: () => []
    };

    expect(m_isReelsTray(cell, KeyWords)).toBe('Reels');
  });

  it('returns empty string for organic post with no Reels signals', () => {
    const normalBtn = {
      getAttribute: () => 'Like post',
      ariaLabel: 'Like post'
    };
    const cell = {
      querySelector: () => null,
      querySelectorAll: () => [normalBtn]
    };

    expect(m_isReelsTray(cell, KeyWords)).toBe('');
  });

  it('returns empty string for null or empty cell', () => {
    expect(m_isReelsTray(null, KeyWords)).toBe('');
    expect(m_isReelsTray({}, KeyWords)).toBe('');
  });
});
