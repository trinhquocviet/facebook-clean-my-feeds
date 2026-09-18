/**
 * Feed Cleaners Factory
 * Part of FB - Clean My Feeds
 *
 * Provides a unified factory binding feed cleaners to runtime application context.
 *
 * @module modules/feed-cleaners/factory
 */

import {
  mopUpTheNewsFeed,
  mopUpTheGroupsFeed,
  mopUpTheWatchVideosFeed,
  mopUpTheMarketplaceFeed,
  mopUpTheSearchFeed,
  mopUpTheReelFeed,
  mopUpTheProfilePage,
  mp_hideBox,
  mp_stopTrackingDirtIntoMyHouse,
  mp_hideSponsoredItems
} from './index.js';

/**
 * Creates and binds all feed cleaners to the application state context.
 *
 * @param {Object} options
 * @param {Object} options.VARS - Application state
 * @param {Function} options.getKeyWords - Returns current localized keywords
 * @param {Object} options.masterKeyWords - Keyword master dictionary
 * @param {Object} options.postObscurer - Post obscurer methods
 * @param {Object} options.dirtyChecker - Dirty check methods
 * @param {string} [options.log=''] - Log prefix
 * @param {Document} [options.doc=document] - DOM document
 * @param {Window} [options.windowObj=window] - Browser window object
 * @returns {Object} Cleaners map
 */
export function createFeedCleaners({
  VARS,
  getKeyWords,
  masterKeyWords,
  postObscurer,
  dirtyChecker,
  log = '',
  doc = typeof document !== 'undefined' ? document : null,
  windowObj = typeof window !== 'undefined' ? window : null
}) {
  const getContext = (dirtyFn) => ({
    VARS,
    KeyWords: getKeyWords ? getKeyWords() : {},
    masterKeyWords,
    postObscurer,
    isTheHouseDirty: dirtyFn,
    log,
    doc,
    windowObj
  });

  return {
    mopUpTheNewsFeed: () => mopUpTheNewsFeed(getContext(dirtyChecker?.isTheHouseDirty)),
    mopUpTheGroupsFeed: () => mopUpTheGroupsFeed(getContext(dirtyChecker?.gf_isTheHouseDirty)),
    mopUpTheWatchVideosFeed: () => mopUpTheWatchVideosFeed(getContext(dirtyChecker?.vf_isTheHouseDirty)),
    mopUpTheMarketplaceFeed: () => mopUpTheMarketplaceFeed(getContext(dirtyChecker?.mp_isTheHouseDirty)),
    mopUpTheSearchFeed: () => mopUpTheSearchFeed(getContext(dirtyChecker?.sf_isTheHouseDirty)),
    mopUpTheReelFeed: (caller) => mopUpTheReelFeed(caller, VARS, doc),
    mopUpTheProfilePage: () => mopUpTheProfilePage(getContext(dirtyChecker?.pp_isTheHouseDirty)),
    mp_hideBox: (box, reason) => mp_hideBox(box, reason, VARS),
    mp_stopTrackingDirtIntoMyHouse: () => mp_stopTrackingDirtIntoMyHouse(doc),
    mp_hideSponsoredItems: () => mp_hideSponsoredItems(VARS, getKeyWords ? getKeyWords() : {}, doc)
  };
}
