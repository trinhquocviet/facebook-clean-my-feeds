import { describe, it, expect } from 'bun:test';
import { m_isUnjoinedGroupPost } from '@/modules/detection/mobile/unjoined-group.js';

describe('modules/detection/mobile/unjoined-group', () => {
  const KeyWords = {
    NF_UNJOINED_GROUP: 'Unjoined Group',
    MOBILE_JOIN_LABELS: ['Join', 'Tham gia'],
    MOBILE_GROUP_SUFFIXES: ['Public group', 'Private group', 'group']
  };

  it('detects unjoined group post with Join button and Public group subtitle', () => {
    const joinBtn = { textContent: 'Join' };
    const subtitle = {
      getAttribute: () => 'Lê Đức, Sep 12, Public group',
      ariaLabel: 'Lê Đức, Sep 12, Public group'
    };

    const cell = {
      querySelector: () => null,
      querySelectorAll: (sel) => {
        if (sel.includes('[aria-label]')) return [subtitle];
        return [joinBtn];
      }
    };

    expect(m_isUnjoinedGroupPost(cell, KeyWords)).toBe('Unjoined Group');
  });

  it('preserves joined group post with Public group subtitle but NO Join button', () => {
    const likeBtn = { textContent: 'Like' };
    const subtitle = {
      getAttribute: () => 'FabulousPeacock1721, 2 hours ago, Public group',
      ariaLabel: 'FabulousPeacock1721, 2 hours ago, Public group'
    };

    const cell = {
      querySelector: () => null,
      querySelectorAll: (sel) => {
        if (sel.includes('[aria-label]')) return [subtitle];
        return [likeBtn];
      }
    };

    expect(m_isUnjoinedGroupPost(cell, KeyWords)).toBe('');
  });

  it('detects unjoined group in Vietnamese locale with "Tham gia"', () => {
    const joinBtn = { textContent: 'Tham gia' };
    const cell = {
      querySelector: () => null,
      querySelectorAll: () => [joinBtn]
    };

    expect(m_isUnjoinedGroupPost(cell, KeyWords)).toBe('Unjoined Group');
  });

  it('returns empty string for null or empty cell', () => {
    expect(m_isUnjoinedGroupPost(null, KeyWords)).toBe('');
    expect(m_isUnjoinedGroupPost({}, KeyWords)).toBe('');
  });
});
