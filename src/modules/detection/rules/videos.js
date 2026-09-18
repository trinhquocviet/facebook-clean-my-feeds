/**
 * Videos Feed Detection Rules
 * Part of FB - Clean My Feeds
 *
 * Classifies posts in Videos Feed: Live videos, Instagram videos,
 * and detects duplicate videos by video ID.
 *
 * @module modules/detection/rules/videos
 */

export function vf_isVideoLive(post, KeyWords) {
  const liveRule = 'div[role="presentation"] ~ div > div:nth-of-type(1) > span';
  const elLive = post.querySelectorAll(liveRule);
  return elLive.length > 0 ? KeyWords.VF_LIVE : '';
}

export function vf_isInstagram(post, KeyWords) {
  const instagramRule = 'div > div > div > div > div > a[href="#"] > div > svg';
  const elInstagram = post.querySelectorAll(instagramRule);
  return elInstagram.length > 0 ? KeyWords.VF_INSTAGRAM : '';
}

export function findDuplicateVideos(urlQuery, postQuery, patternUsed, vf_hidePost, KeyWords, log = '', doc = document) {
  const watchVideos = doc.querySelectorAll(urlQuery);
  if (watchVideos.length < 2) {
    return;
  }

  for (let i = 1; i < watchVideos.length; i++) {
    const videoPost = watchVideos[i].closest ? watchVideos[i].closest(postQuery) : null;
    if (videoPost) {
      if (log) {
        console.info(`${log}findDuplicateVideos(); duplicate: `, urlQuery, postQuery, patternUsed, videoPost);
      }
      vf_hidePost(videoPost, KeyWords.VF_DUPLICATE_VIDEOS, '');
    }
  }
}

export function vf_hideDuplicateVideos(post, postQuery, vf_hidePost, KeyWords, log = '', doc = document) {
  const elWatchVideo = post.querySelector('div > span > a[href*="/watch/?v="]');
  if (elWatchVideo && elWatchVideo.href) {
    try {
      const watchVideoVID = new URL(elWatchVideo.href).searchParams.get('v');
      if (watchVideoVID) {
        findDuplicateVideos(
          `div > span > a[href*="/watch/?v=${watchVideoVID}&"]`,
          postQuery,
          '1',
          vf_hidePost,
          KeyWords,
          log,
          doc
        );
      }
    } catch {
      // Ignore URL parsing errors
    }
  } else {
    const elUserVideo = post.querySelector('div > span > a[href*="/videos/"]');
    if (elUserVideo && elUserVideo.href) {
      const parts = elUserVideo.href.split('/videos/');
      if (parts.length > 1) {
        const watchVideoVID = parts[1].split('/')[0];
        if (watchVideoVID) {
          findDuplicateVideos(
            `div > span > a[href*="/videos/${watchVideoVID}/"]`,
            postQuery,
            '2',
            vf_hidePost,
            KeyWords,
            log,
            doc
          );
        }
      }
    }
  }
}
