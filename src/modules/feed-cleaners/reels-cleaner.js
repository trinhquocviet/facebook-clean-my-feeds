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
 * Mops up and enhances Reels video playback.
 *
 * @param {string} caller - Invocation source ('self' or external)
 * @param {Object} VARS - Application state
 * @param {Document} [doc=document] - DOM document
 */
export function mopUpTheReelFeed(caller, VARS, doc = document) {
  if (!VARS.isRF) {
    VARS.isRF_InTimeoutMode = false;
    return;
  }
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
            elDescriptionContainer.setAttribute(
              'style',
              `margin-bottom:${VARS.isChromium ? '4.5' : '2.25'}rem;`
            );
            video.setAttribute('controls', 'true');
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
        video.setAttribute(rvAtt, '1');
      }
    }
  }

  VARS.isRF_InTimeoutMode = true;
  setTimeout(function () {
    mopUpTheReelFeed('self', VARS, doc);
  }, 1000);
}
