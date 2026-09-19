import { describe, it, expect } from 'bun:test';
import { m_getActorName, m_getHeaderRow } from '@/modules/detection/mobile/actor.js';

describe('modules/detection/mobile/actor', () => {
  describe('m_getActorName', () => {
    it('returns empty string when cell is null or missing', () => {
      expect(m_getActorName(null)).toBe('');
      expect(m_getActorName({})).toBe('');
    });

    it('extracts name from "More options for {Name}" button', () => {
      const cell = {
        querySelector: (sel) => {
          if (sel.includes('More options for')) {
            return {
              getAttribute: () => 'More options for Hay Nhức Nhói',
              ariaLabel: 'More options for Hay Nhức Nhói'
            };
          }
          return null;
        }
      };
      expect(m_getActorName(cell)).toBe('Hay Nhức Nhói');
    });

    it('extracts name from avatar profile picture aria-label', () => {
      const cell = {
        querySelector: (sel) => {
          if (sel.includes('More options for')) return null;
          if (sel.includes('profile picture')) {
            return {
              getAttribute: () => 'Singapore Airlines profile picture',
              ariaLabel: 'Singapore Airlines profile picture'
            };
          }
          return null;
        }
      };
      expect(m_getActorName(cell)).toBe('Singapore Airlines');
    });

    it('extracts name from role="link" span as fallback', () => {
      const cell = {
        querySelector: (sel) => {
          if (sel.includes('More options for') || sel.includes('profile picture')) return null;
          if (sel.includes('role="link"')) {
            return { textContent: '  Linux Inside  ' };
          }
          return null;
        }
      };
      expect(m_getActorName(cell)).toBe('Linux Inside');
    });
  });

  describe('m_getHeaderRow', () => {
    it('resolves header row ancestor from options button', () => {
      const parentRow = {
        querySelector: (sel) => (sel.includes('role="link"') ? {} : null)
      };
      const optionsBtn = {
        parentNode: parentRow
      };
      const cell = {
        querySelector: (sel) => (sel.includes('More options') ? optionsBtn : null)
      };
      expect(m_getHeaderRow(cell)).toBe(parentRow);
    });

    it('falls back to cell itself if no specific header row container resolved', () => {
      const cell = {
        querySelector: () => null
      };
      expect(m_getHeaderRow(cell)).toBe(cell);
    });
  });
});
