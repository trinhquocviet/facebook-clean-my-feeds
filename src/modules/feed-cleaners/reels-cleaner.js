/**
 * Reels Feed Cleaner Module
 * Part of FB - Clean My Feeds
 *
 * Implements video control injection, custom margins for overlays,
 * looping disabling, and recurring timeout polling for Reels player.
 *
 * @module modules/feed-cleaners/reels-cleaner
 */

import { rvAtt } from '@/constants/index.js';

/**
 * Mops up and enhances Reels video playback in Facebook's standalone Reels viewer.
 *
 * ## Features Implemented
 * 1. **Native Controls Injection**: Injects `controls="true"` onto `<video>` elements, giving
 *    users direct timeline seeking, volume control, and fullscreen toggles.
 * 2. **Description Overlay Clearance**:
 *    Facebook positions title/sound descriptions at the bottom of the video frame, which would
 *    overlap and obstruct the newly injected native browser video controls.
 *    - On **Chromium** browsers: sets `margin-bottom: 4.5rem` to clear Chrome's larger native control bar.
 *    - On **Gecko / WebKit** (Firefox / Safari): sets `margin-bottom: 2.25rem`.
 * 3. **Looping Suppression**:
 *    When `REELS_DISABLE_LOOPING` is enabled, attaches an `ended` event listener calling `pause()`
 *    so videos do not automatically replay indefinitely.
 * 4. **Recursive Polling Guard**:
 *    Facebook mounts and unmounts `<video>` tags dynamically as the user scrolls Reels.
 *    Uses a self-invoking `setTimeout(..., 1000)` loop (`caller === 'self'`) guarded by
 *    `VARS.isRF_InTimeoutMode` to prevent multiple concurrent timers.
 *
 * @param {string} caller - Invocation source ('self' when called from internal timer, or external)
 * @param {Object} VARS - Application state
 * @param {Document} [doc=document] - DOM document
 */
export function mopUpTheReelFeed(caller, VARS, doc = document) {
  if (!VARS.isRF) {
    VARS.isRF_InTimeoutMode = false;
    return;
  }
  // Prevent duplicate timer loops if an external trigger arrives while already in timeout mode
  if (caller !== 'self' && VARS.isRF_InTimeoutMode === true) {
    return;
  }

  const videoRules = `[data-video-id] video:not([${rvAtt}])`;
  const videos = doc.querySelectorAll(videoRules);

  for (const video of videos) {
    const elVideoId = video.closest ? video.closest('[data-video-id]') : null;
    if (elVideoId) {
      const videoContainer = elVideoId.parentElement;
      if (videoContainer) {
        if (VARS.Options?.REELS_CONTROLS === true) {
          const descriptionOverlay = videoContainer.nextElementSibling;
          if (descriptionOverlay && descriptionOverlay.children?.[0]) {
            const elDescriptionContainer = descriptionOverlay.children[0];
            // Push description upward to avoid overlapping native browser video scrubbers
            elDescriptionContainer.setAttribute(
              'style',
              `margin-bottom:${VARS.isChromium ? '4.5' : '2.25'}rem;`
            );
            video.setAttribute('controls', 'true');
            // Hide Facebook's custom click-to-pause overlay sibling to allow native control interaction
            const sibling = video.nextElementSibling;
            if (sibling) {
              sibling.setAttribute('style', 'display:none;');
            }
          }
        }
        if (VARS.Options?.REELS_DISABLE_LOOPING === true) {
          video.addEventListener('ended', function (ev) {
            ev.target.pause();
          });
        }
        // Stamp video as configured
        video.setAttribute(rvAtt, '1');
      }
    }
  }

  // Schedule next polling tick for dynamically mounted Reels
  VARS.isRF_InTimeoutMode = true;
  setTimeout(function () {
    mopUpTheReelFeed('self', VARS, doc);
  }, 1000);
}
