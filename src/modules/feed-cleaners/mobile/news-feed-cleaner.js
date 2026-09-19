/**
 * Mobile News Feed Cleaner
 * Part of FB - Clean My Feeds
 *
 * Orchestrates detection, classification, and obscuring for m.facebook.com news feed.
 *
 * @module modules/feed-cleaners/mobile/news-feed-cleaner
 */

import { mainColumnAtt } from '@/constants/index.js';
import {
  m_getCollectionOfCells,
  m_isDividerOrSkeleton,
  m_isHeaderOrChrome,
  m_isStoriesTray,
  m_isReelsTray,
  m_isSponsored,
  m_isSuggestedFollow,
  m_isUnjoinedGroupPost
} from '@/modules/detection/mobile/index.js';
import { isGloballyBlockedText } from '@/modules/detection/text-filter.js';

/**
 * Sweeps and cleans the mobile news feed.
 *
 * @param {Object} ctx - Cleaner context
 * @param {Object} ctx.VARS - Application state
 * @param {Object} ctx.KeyWords - Localized dictionary
 * @param {Object} ctx.postObscurer - Post obscuring methods
 * @param {Function} ctx.isTheHouseDirty - Dirty checker method
 * @param {Document} [ctx.doc=document] - DOM document
 */
export function m_mopUpTheNewsFeed(ctx) {
  const { VARS, KeyWords, postObscurer, isTheHouseDirty, doc = document } = ctx;

  // 1. Check if feed content has changed
  const [mainColumn] = isTheHouseDirty ? isTheHouseDirty() : [null, null];
  if (!mainColumn) return;

  // 2. Stamp innerHTML length to prevent redundant sweeps
  if (typeof mainColumn.setAttribute === 'function') {
    mainColumn.setAttribute(mainColumnAtt, (mainColumn.innerHTML?.length || 0).toString());
  }

  // 3. Collect top-level feed cells
  const cells = m_getCollectionOfCells(doc);
  if (!cells || cells.length === 0) return;

  // 4. Waterfall classification per cell
  for (const cell of cells) {
    // Fast skip for spacers, dividers, skeletons, and app navigation chrome
    if (m_isDividerOrSkeleton(cell) || m_isHeaderOrChrome(cell)) {
      continue;
    }

    // Skip if already obscured
    if (postObscurer.isPostAlreadyObscured(cell) || postObscurer.nf_isPostAlreadyHidden(cell)) {
      continue;
    }

    try {
      // Step A: Horizontal Feature Trays (Pre-pass)
      const allowStories = VARS?.Options?.MF_STORIES ?? VARS?.Options?.NF_STORIES ?? true;
      if (allowStories) {
        const storiesReason = m_isStoriesTray(cell, KeyWords);
        if (storiesReason) {
          postObscurer.hideFeature(cell, storiesReason);
          continue;
        }
      }

      const allowReels = VARS?.Options?.MF_REELS ?? VARS?.Options?.NF_SHORT_REEL_VIDEO ?? true;
      if (allowReels) {
        const reelsReason = m_isReelsTray(cell, KeyWords);
        if (reelsReason) {
          postObscurer.hideFeature(cell, reelsReason);
          continue;
        }
      }

      // Step B: Commercial Sponsored / Ads
      const allowSponsored = VARS?.Options?.MF_SPONSORED ?? VARS?.Options?.SPONSORED ?? true;
      if (allowSponsored) {
        const sponsoredReason = m_isSponsored(cell, KeyWords);
        if (sponsoredReason) {
          postObscurer.nf_hidePost(cell, sponsoredReason);
          continue;
        }
      }

      // Step C: Algorithmic Recommendations ("Follow" CTA)
      const allowFollow = VARS?.Options?.MF_SUGGESTED_FOLLOW ?? VARS?.Options?.NF_FOLLOW ?? true;
      if (allowFollow) {
        const followReason = m_isSuggestedFollow(cell, KeyWords);
        if (followReason) {
          postObscurer.nf_hidePost(cell, followReason);
          continue;
        }
      }

      // Step D: Unjoined Groups ("Join" CTA)
      const allowUnjoined = VARS?.Options?.MF_UNJOINED_GROUPS ?? VARS?.Options?.NF_UNJOINED_GROUP ?? true;
      if (allowUnjoined) {
        const unjoinedReason = m_isUnjoinedGroupPost(cell, KeyWords);
        if (unjoinedReason) {
          postObscurer.nf_hidePost(cell, unjoinedReason);
          continue;
        }
      }

      // Step E: User-defined Text Blocklist
      if (VARS && VARS.Filters) {
        const blockedReason = isGloballyBlockedText(cell.textContent || '', VARS);
        if (blockedReason) {
          postObscurer.nf_hidePost(cell, blockedReason);
          continue;
        }
      }
    } catch (err) {
      // Silent recovery in production to avoid crashing feed scroll
      if (VARS?.Options?.VERBOSITY_DEBUG) {
        console.debug('m_mopUpTheNewsFeed cell error:', err);
      }
    }
  }
}
