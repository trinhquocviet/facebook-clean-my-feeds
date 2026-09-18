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
 * ## Dependency Injection Pattern
 * Rather than importing mutable global state directly across all feed cleaner modules,
 * `createFeedCleaners` acts as an IoC (Inversion of Control) container. It bundles:
 * - Application mutable state (`VARS`)
 * - Reactive keyword retrieval (`getKeyWords()`)
 * - Obscurer operations (`postObscurer`)
 * - Specialized dirty check functions (`dirtyChecker.*`)
 * - Document and Window environments (enabling seamless unit testing in JSDOM)
 *
 * Returns a high-level API where each method (e.g. `mopUpTheNewsFeed()`) can be invoked
 * without parameters by the router or scheduler.
 *
 * @param {Object} options - Configuration and dependency bag
 * @param {Object} options.VARS - Application state
 * @param {Function} options.getKeyWords - Function returning current localized keywords
 * @param {Object} options.masterKeyWords - Keyword master dictionary
 * @param {Object} options.postObscurer - Post obscurer methods
 * @param {Object} options.dirtyChecker - Dirty check methods collection
 * @param {string} [options.log=''] - Log prefix
 * @param {Document} [options.doc=document] - DOM document
 * @param {Window} [options.windowObj=window] - Browser window object
 * @returns {Object} Map of bound cleaner functions ready for scheduler execution
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
  // Helper closure binding route-specific dirty checker into runtime context
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
