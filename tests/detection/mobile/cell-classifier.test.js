import { describe, it, expect } from 'bun:test';
import {
  m_isDividerOrSkeleton,
  m_isHeaderOrChrome,
  m_getAdjacentDivider
} from '@/modules/detection/mobile/cell-classifier.js';

describe('modules/detection/mobile/cell-classifier', () => {
  describe('m_isDividerOrSkeleton', () => {
    it('returns true for null or non-element nodes', () => {
      expect(m_isDividerOrSkeleton(null)).toBe(true);
      expect(m_isDividerOrSkeleton({ nodeType: 3 })).toBe(true);
    });

    it('identifies 1px and 2px divider elements by data-actual-height', () => {
      const el1 = {
        nodeType: 1,
        getAttribute: (attr) => (attr === 'data-actual-height' ? '1' : null)
      };
      expect(m_isDividerOrSkeleton(el1)).toBe(true);

      const el2 = {
        nodeType: 1,
        getAttribute: (attr) => (attr === 'data-actual-height' ? '2' : null)
      };
      expect(m_isDividerOrSkeleton(el2)).toBe(true);
    });

    it('identifies 1px/2px elements by inline height styles', () => {
      const el = {
        nodeType: 1,
        getAttribute: (attr) => (attr === 'style' ? 'height:1px; z-index:0;' : null)
      };
      expect(m_isDividerOrSkeleton(el)).toBe(true);
    });

    it('identifies filler and pull-to-refresh spinner elements', () => {
      const elFiller = {
        nodeType: 1,
        classList: { contains: (c) => c === 'filler' }
      };
      expect(m_isDividerOrSkeleton(elFiller)).toBe(true);
    });

    it('identifies empty skeleton placeholders', () => {
      const elEmpty = {
        nodeType: 1,
        querySelector: () => null,
        textContent: ''
      };
      expect(m_isDividerOrSkeleton(elEmpty)).toBe(true);
    });

    it('returns false for actual content post cells', () => {
      const elPost = {
        nodeType: 1,
        getAttribute: (attr) => (attr === 'style' ? 'height:479px; width:393px;' : null),
        querySelector: (sel) => (sel.includes('button') ? { tagName: 'DIV' } : null),
        textContent: 'Some post text content'
      };
      expect(m_isDividerOrSkeleton(elPost)).toBe(false);
    });
  });

  describe('m_isHeaderOrChrome', () => {
    it('returns true for header bar containing Facebook logo or search', () => {
      const elLogo = {
        nodeType: 1,
        querySelector: (sel) => (sel.includes('Facebook logo') ? {} : null)
      };
      expect(m_isHeaderOrChrome(elLogo)).toBe(true);
    });

    it('returns true for tablist navigation bar', () => {
      const elTabs = {
        nodeType: 1,
        querySelector: (sel) => (sel.includes('tablist') ? {} : null)
      };
      expect(m_isHeaderOrChrome(elTabs)).toBe(true);
    });

    it('returns false for feed post cells', () => {
      const elPost = {
        nodeType: 1,
        querySelector: () => null
      };
      expect(m_isHeaderOrChrome(elPost)).toBe(false);
    });
  });

  describe('m_getAdjacentDivider', () => {
    it('finds preceding 1px divider sibling', () => {
      const divider = {
        nodeType: 1,
        getAttribute: (attr) => (attr === 'data-actual-height' ? '1' : null)
      };
      const post = {
        previousElementSibling: divider,
        nextElementSibling: null
      };
      expect(m_getAdjacentDivider(post)).toBe(divider);
    });

    it('finds following 1px divider sibling when preceding is null', () => {
      const divider = {
        nodeType: 1,
        getAttribute: (attr) => (attr === 'data-actual-height' ? '1' : null)
      };
      const post = {
        previousElementSibling: null,
        nextElementSibling: divider
      };
      expect(m_getAdjacentDivider(post)).toBe(divider);
    });

    it('returns null when no sibling is a divider', () => {
      const regularSibling = {
        nodeType: 1,
        getAttribute: () => null,
        querySelector: () => ({}),
        textContent: 'Next post'
      };
      const post = {
        previousElementSibling: regularSibling,
        nextElementSibling: null
      };
      expect(m_getAdjacentDivider(post)).toBe(null);
    });
  });
});
