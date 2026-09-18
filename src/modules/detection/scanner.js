/**
 * DOM Scanner Module
 * Part of FB - Clean My Feeds
 *
 * Traverses DOM subtrees to extract visible text and image alt text,
 * bypassing decoy elements and handling special Facebook DOM structures.
 *
 * @module modules/detection/scanner
 */

import {
  cleanText,
  countDescendants,
  removeDustyElements
} from '@/utils/index.js';
import { postPropDS } from '@/constants/index.js';

/**
 * Removes decoy / dusty DOM elements from a post element.
 *
 * @param {HTMLElement} post - Element to dust
 * @param {Object} VARS - Application state
 * @returns {number} Count of dusty elements removed
 */
export function doLightDusting(post, VARS) {
  return removeDustyElements(post, {
    propDS: postPropDS,
    scanCountStart: VARS?.scanCountStart ?? 0,
    scanCountMaxLoop: VARS?.scanCountMaxLoop ?? 10
  });
}

/**
 * Walks a DOM node and extracts visible, non-meta text values.
 * Handles "Anonymous participant" wrapped in objects and buttons.
 *
 * @param {HTMLElement} theNode - Root node to scan
 * @param {Document} [doc=document] - DOM document
 * @returns {Array<string>} Unique list of extracted text tokens
 */
export function scanTreeForText(theNode, doc = document) {
  const arrayTextValues = [];
  const elements = theNode.querySelectorAll(':scope > div, :scope > blockquote, :scope > span');

  for (const element of elements) {
    if (element.hasAttribute('aria-hidden') && element.getAttribute('aria-hidden') === 'false') {
      continue;
    }

    // NodeFilter.SHOW_TEXT = 4
    const nodeFilterVal = (typeof NodeFilter !== 'undefined' && NodeFilter.SHOW_TEXT) ? NodeFilter.SHOW_TEXT : 4;
    const walk = doc.createTreeWalker(element, nodeFilterVal, null);
    let currentNode;

    while ((currentNode = walk.nextNode())) {
      const elParent = currentNode.parentElement;
      if (!elParent) continue;

      const elParentTN = elParent.tagName ? elParent.tagName.toLowerCase() : '';
      const val = cleanText(currentNode.textContent).trim();

      if (val === '' || val.toLowerCase() === 'facebook') {
        continue;
      }

      if (elParent.hasAttribute('aria-hidden') && elParent.getAttribute('aria-hidden') === 'true') {
        continue;
      }

      if (elParentTN === 'div' && elParent.hasAttribute('role') && elParent.getAttribute('role') === 'button') {
        // -- February 2024 - issue with "Anonymous participant"
        if (elParent.parentElement && elParent.parentElement.tagName.toLowerCase() !== 'object') {
          continue;
        }
      }

      if (elParentTN === 'title') {
        continue;
      }

      const elGeneric = elParent.closest ? elParent.closest('div[role="button"]') : null;
      const elGenericDescendantsCount = elGeneric ? countDescendants(elGeneric) : 0;

      if (elGenericDescendantsCount < 2 && val.length > 1) {
        arrayTextValues.push(...val.split('\n'));
      }
    }
  }

  return [...new Set(arrayTextValues)];
}

/**
 * Fast tree walker for marketplace item cards.
 *
 * @param {HTMLElement} theNode - Root node to scan
 * @param {Document} [doc=document] - DOM document
 * @returns {Array<string>} Array of lowercase text tokens
 */
export function mp_scanTreeForText(theNode, doc = document) {
  const arrayTextValues = [];
  const nodeFilterVal = (typeof NodeFilter !== 'undefined' && NodeFilter.SHOW_TEXT) ? NodeFilter.SHOW_TEXT : 4;
  const walk = doc.createTreeWalker(theNode, nodeFilterVal, null);
  let n;

  while ((n = walk.nextNode())) {
    const val = cleanText(n.textContent).trim();
    if (val !== '' && val.length > 1 && val.toLowerCase() !== 'facebook') {
      arrayTextValues.push(val.toLowerCase());
    }
  }

  return arrayTextValues;
}

/**
 * Extracts alt text from images within a node, ignoring emoji icons (<33px).
 *
 * @param {HTMLElement} theNode - Root node to scan
 * @returns {Array<string>} Array of alt text strings
 */
export function scanImagesForAltText(theNode) {
  const arrayAltTextValues = [];
  const images = theNode.querySelectorAll('img[alt]');

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    if (img.alt && img.alt.length > 0 && (img.naturalWidth === undefined || img.naturalWidth > 32)) {
      const sAlt = cleanText(img.alt);
      if (!arrayAltTextValues.includes(sAlt)) {
        arrayAltTextValues.push(sAlt);
      }
    }
  }

  return arrayAltTextValues;
}

/**
 * Extracts text and alt text from the top blocks of a feed post.
 *
 * @param {HTMLElement} post - Post element
 * @param {string} selector - Query selector for post blocks
 * @param {number} maxBlocks - Max number of blocks to scan
 * @param {Document} [doc=document] - DOM document
 * @returns {Array<string>} Array of non-empty text strings
 */
export function extractTextContent(post, selector, maxBlocks, doc = document) {
  const blocks = post.querySelectorAll(selector);
  const arrayTextValues = [];

  for (let b = 0; b < Math.min(maxBlocks, blocks.length); b++) {
    const block = blocks[b];
    if (countDescendants(block) > 0) {
      arrayTextValues.push(...scanTreeForText(block, doc));
      arrayTextValues.push(...scanImagesForAltText(block));
    }
  }

  return arrayTextValues.filter((item) => item !== '');
}
