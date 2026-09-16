import { describe, test, expect } from 'bun:test';
import {
  climbUpTheTree,
  countDescendants,
  querySelectorAllNoChildren,
  hasSizeChanged,
  removeDustyElements
} from '../../src/utils/dom.js';

describe('utils/dom', () => {
  describe('climbUpTheTree', () => {
    test('climbs up 1 branch by default', () => {
      const parent = { id: 'parent', parentNode: null };
      const child = { id: 'child', parentNode: parent };
      expect(climbUpTheTree(child)).toBe(parent);
    });

    test('climbs up specified number of branches', () => {
      const root = { id: 'root', parentNode: null };
      const middle = { id: 'middle', parentNode: root };
      const leaf = { id: 'leaf', parentNode: middle };

      expect(climbUpTheTree(leaf, 2)).toBe(root);
      expect(climbUpTheTree(leaf, 1)).toBe(middle);
    });

    test('returns null if branches exceed tree depth or element is null', () => {
      const element = { id: 'el', parentNode: null };
      expect(climbUpTheTree(element, 5)).toBe(null);
      expect(climbUpTheTree(null, 1)).toBe(null);
    });
  });

  describe('countDescendants', () => {
    test('counts matching descendants via querySelectorAll', () => {
      const mockElement = {
        querySelectorAll: (selector) => {
          if (selector === 'div, span') {
            return [{}, {}, {}];
          }
          return [];
        }
      };
      expect(countDescendants(mockElement)).toBe(3);
    });

    test('returns 0 for null or invalid elements', () => {
      expect(countDescendants(null)).toBe(0);
      expect(countDescendants({})).toBe(0);
    });
  });

  describe('querySelectorAllNoChildren', () => {
    test('filters for childless leaf nodes with minimum text length', () => {
      const leaf1 = { children: [], textContent: 'Sponsored' };
      const leaf2 = { children: [], textContent: '' };
      const parentNode = { children: [leaf1], textContent: 'Sponsored' };

      const mockContainer = {
        querySelectorAll: (query) => {
          if (query === 'span') {
            return [parentNode, leaf1, leaf2];
          }
          return [];
        }
      };

      const result = querySelectorAllNoChildren(mockContainer, ['span'], 1, false);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(leaf1);
    });

    test('returns all matching leaves when executeAllQueries is true', () => {
      const leafA = { children: [], textContent: 'First' };
      const leafB = { children: [], textContent: 'Second' };

      const mockContainer = {
        querySelectorAll: (combined) => {
          return [leafA, leafB];
        }
      };

      const result = querySelectorAllNoChildren(mockContainer, ['a', 'b'], 1, true);
      expect(result).toHaveLength(2);
    });

    test('returns empty array if no queries provided or container is null', () => {
      expect(querySelectorAllNoChildren(null, ['div'])).toEqual([]);
      expect(querySelectorAllNoChildren({ querySelectorAll: () => [] }, [])).toEqual([]);
    });
  });

  describe('hasSizeChanged', () => {
    test('returns false when difference is within tolerance threshold', () => {
      expect(hasSizeChanged(100, 110, 16)).toBe(false);
      expect(hasSizeChanged(100, 116, 16)).toBe(false);
      expect(hasSizeChanged('5000', '5010')).toBe(false);
    });

    test('returns true when difference exceeds tolerance threshold', () => {
      expect(hasSizeChanged(100, 117, 16)).toBe(true);
      expect(hasSizeChanged(100, 150, 16)).toBe(true);
      expect(hasSizeChanged('5000', '5050')).toBe(true);
    });

    test('returns false for invalid non-numeric inputs', () => {
      expect(hasSizeChanged('abc', 'def')).toBe(false);
      expect(hasSizeChanged(null, 100)).toBe(false);
    });
  });

  describe('removeDustyElements', () => {
    test('returns 0 for null or invalid element', () => {
      expect(removeDustyElements(null)).toBe(0);
      expect(removeDustyElements(undefined)).toBe(0);
      expect(removeDustyElements({})).toBe(0);
    });

    test('removes matching elements and updates scan count on element', () => {
      let removed1 = false;
      let removed2 = false;
      const el1 = { remove: () => { removed1 = true; } };
      const el2 = { remove: () => { removed2 = true; } };

      const mockPost = {
        querySelectorAll: (selector) => {
          if (selector === '[data-0="0"]') {
            return [el1, el2];
          }
          return [];
        }
      };

      const count = removeDustyElements(mockPost, {
        propDS: 'test_dusted',
        scanCountStart: 0,
        scanCountMaxLoop: 15
      });

      expect(count).toBe(2);
      expect(removed1).toBe(true);
      expect(removed2).toBe(true);
      expect(mockPost.test_dusted).toBe(1);
    });

    test('stops scanning and returns 0 when scanCount reaches scanCountMaxLoop', () => {
      let queryCalled = false;
      const mockPost = {
        test_dusted: 15,
        querySelectorAll: () => {
          queryCalled = true;
          return [];
        }
      };

      const count = removeDustyElements(mockPost, {
        propDS: 'test_dusted',
        scanCountStart: 0,
        scanCountMaxLoop: 15
      });

      expect(count).toBe(0);
      expect(queryCalled).toBe(false);
    });

    test('handles string numeric values in propDS', () => {
      const mockPost = {
        test_dusted: '2',
        querySelectorAll: () => []
      };

      const count = removeDustyElements(mockPost, {
        propDS: 'test_dusted',
        scanCountStart: 0,
        scanCountMaxLoop: 5
      });

      expect(count).toBe(0);
      expect(mockPost.test_dusted).toBe(3);
    });

    test('resets invalid or negative scan count to scanCountStart', () => {
      const mockPost = {
        test_dusted: -5,
        querySelectorAll: () => []
      };

      removeDustyElements(mockPost, {
        propDS: 'test_dusted',
        scanCountStart: 0,
        scanCountMaxLoop: 5
      });

      expect(mockPost.test_dusted).toBe(1);
    });
  });
});

