import { describe, it, expect } from 'bun:test';
import { m_isStoriesTray } from '@/modules/detection/mobile/stories.js';

describe('modules/detection/mobile/stories', () => {
  const KeyWords = {
    NF_STORIES: 'Stories'
  };

  it('detects Stories tray when cards match Create story and View story patterns', () => {
    const cardCreate = {
      getAttribute: () => 'Create story',
      ariaLabel: 'Create story'
    };
    const cardUser = {
      getAttribute: () => "View Hạ Nguyễn's story. 1 unseen story",
      ariaLabel: "View Hạ Nguyễn's story. 1 unseen story"
    };

    const hscroller = {
      querySelectorAll: () => [cardCreate, cardUser]
    };
    const cell = {
      querySelector: (sel) => (sel.includes('hscroller') ? hscroller : null)
    };

    expect(m_isStoriesTray(cell, KeyWords)).toBe('Stories');
  });

  it('rejects general ad media carousel whose cards do not match stories regex', () => {
    const adImageCard1 = {
      getAttribute: () => 'Product 1',
      ariaLabel: 'Product 1'
    };
    const adImageCard2 = {
      getAttribute: () => 'Product 2',
      ariaLabel: 'Product 2'
    };

    const hscroller = {
      querySelectorAll: () => [adImageCard1, adImageCard2]
    };
    const cell = {
      querySelector: (sel) => (sel.includes('hscroller') ? hscroller : null)
    };

    expect(m_isStoriesTray(cell, KeyWords)).toBe('');
  });

  it('returns empty string for null or non-hscroller cells', () => {
    expect(m_isStoriesTray(null, KeyWords)).toBe('');
    expect(m_isStoriesTray({ querySelector: () => null }, KeyWords)).toBe('');
  });
});
