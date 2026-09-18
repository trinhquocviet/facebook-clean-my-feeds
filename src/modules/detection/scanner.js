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
 * Removes decoy / "dusty" DOM elements from a post element.
 *
 * Facebook frequently inserts invisible decoy spans, off-screen nodes, or zero-width
 * elements designed to trick ad-blocking regexes and userscript text extractors.
 * This function cleanses the post subtree using an iterative dust removal algorithm
 * bounded by `scanCountMaxLoop` (default 10) to prevent performance degradation.
 *
 * @param {HTMLElement} post - Element to dust
 * @param {Object} VARS - Application state containing scanCountStart and scanCountMaxLoop
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
 * Walks a DOM node and extracts visible, non-meta text tokens.
 *
 * Architectural & Anti-Obfuscation Decisions:
 * 1. TreeWalker (`NodeFilter.SHOW_TEXT = 4`): Used instead of `element.textContent`
 *    because `textContent` blindly concatenates hidden spans, off-screen text,
 *    and decoy nodes injected by Facebook to defeat adblockers.
 * 2. Branding Watermarks: Text nodes matching 'facebook' are ignored to prevent
 *    accidental hits on embedded branding elements.
 * 3. Group Posts & "Anonymous participant" (February 2024 fix): Anonymous group posts
 *    wrap author labels inside `[role="button"]` elements. Standard interactive buttons
 *    (Like, Comment, Share) must be ignored, but anonymous author headers must be captured
 *    by verifying their `<object>` ancestor wrapper.
 * 4. Interactive Widget Exclusion: Buttons with 2 or more descendants (`elGenericDescendantsCount >= 2`)
 *    represent complex interactive controls (such as emoji reaction pickers or share menus)
 *    whose internal text should not contaminate the post's text filter tokens.
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

    // NodeFilter.SHOW_TEXT = 4 (standard W3C TreeWalker text node constant)
    const nodeFilterVal = (typeof NodeFilter !== 'undefined' && NodeFilter.SHOW_TEXT) ? NodeFilter.SHOW_TEXT : 4;
    const walk = doc.createTreeWalker(element, nodeFilterVal, null);
    let currentNode;

    while ((currentNode = walk.nextNode())) {
      const elParent = currentNode.parentElement;
      if (!elParent) continue;

      const elParentTN = elParent.tagName ? elParent.tagName.toLowerCase() : '';
      const val = cleanText(currentNode.textContent).trim();

      // Skip empty text or hidden Facebook branding watermarks
      if (val === '' || val.toLowerCase() === 'facebook') {
        continue;
      }

      // Ignore text explicitly flagged as hidden for screen readers
      if (elParent.hasAttribute('aria-hidden') && elParent.getAttribute('aria-hidden') === 'true') {
        continue;
      }

      // Handle buttons: distinguish standard action buttons from "Anonymous participant"
      if (elParentTN === 'div' && elParent.hasAttribute('role') && elParent.getAttribute('role') === 'button') {
        if (elParent.parentElement && elParent.parentElement.tagName.toLowerCase() !== 'object') {
          continue;
        }
      }

      // Skip document/element title tags
      if (elParentTN === 'title') {
        continue;
      }

      // Ignore complex interactive widgets (e.g. reaction pickers with multiple children)
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
 * High-speed TreeWalker scanner optimized for Marketplace item cards.
 * Extracts plain lowercase text tokens (titles, prices, location badges).
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
 * Extracts alt text from images within a node.
 * Filters out UI icons, emoji reactions, and profile badges by inspecting `naturalWidth > 32`.
 *
 * @param {HTMLElement} theNode - Root node to scan
 * @returns {Array<string>} Array of meaningful image alt text strings
 */
export function scanImagesForAltText(theNode) {
  const arrayAltTextValues = [];
  const images = theNode.querySelectorAll('img[alt]');

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    // Ignore emoji reactions and tiny UI badges (<= 32px)
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
 * Extracts text and alt text from the primary content blocks of a post.
 * Limits extraction to `maxBlocks` (typically 1 to 3) to prevent scanning deep into
 * lengthy user comment sections while capturing title, description, and media alt text.
 *
 * @param {HTMLElement} post - Post element
 * @param {string} selector - Query selector for post content blocks
 * @param {number} maxBlocks - Max number of blocks to scan (e.g. 3)
 * @param {Document} [doc=document] - DOM document
 * @returns {Array<string>} Array of non-empty extracted text strings
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

