import { describe, it, expect } from 'bun:test';
import {
  doLightDusting,
  scanImagesForAltText,
  mp_scanTreeForText
} from '@/modules/detection/scanner.js';
import { createInitialState } from '@/state/index.js';

describe('modules/detection/scanner', () => {
  describe('doLightDusting', () => {
    it('executes without error on empty or clean elements', () => {
      const VARS = createInitialState();
      const mockPost = {
        querySelectorAll: () => []
      };
      const count = doLightDusting(mockPost, VARS);
      expect(count).toBe(0);
    });
  });

  describe('scanImagesForAltText', () => {
    it('extracts alt text ignoring short emoji images', () => {
      const mockNode = {
        querySelectorAll: (sel) => {
          if (sel === 'img[alt]') {
            return [
              { alt: 'A beautiful sunset photo', naturalWidth: 400 },
              { alt: '😀', naturalWidth: 16 } // emoji, should be ignored
            ];
          }
          return [];
        }
      };

      const results = scanImagesForAltText(mockNode);
      expect(results.length).toBe(1);
      expect(results[0]).toBe('A beautiful sunset photo');
    });

    it('deduplicates duplicate alt text strings', () => {
      const mockNode = {
        querySelectorAll: () => [
          { alt: 'Product Image', naturalWidth: 200 },
          { alt: 'Product Image', naturalWidth: 200 }
        ]
      };

      const results = scanImagesForAltText(mockNode);
      expect(results.length).toBe(1);
      expect(results[0]).toBe('Product Image');
    });
  });

  describe('mp_scanTreeForText', () => {
    it('extracts lowercase text tokens using TreeWalker mock', () => {
      const textNodes = [
        { textContent: 'iPhone 15 Pro' },
        { textContent: '$999' },
        { textContent: 'Facebook' }, // should be ignored
        { textContent: ' ' } // empty, should be ignored
      ];
      let index = 0;

      const mockDoc = {
        createTreeWalker: () => ({
          nextNode: () => (index < textNodes.length ? textNodes[index++] : null)
        })
      };

      const results = mp_scanTreeForText({}, mockDoc);
      expect(results).toContain('iphone 15 pro');
      expect(results).toContain('$999');
      expect(results).not.toContain('facebook');
    });
  });
});
