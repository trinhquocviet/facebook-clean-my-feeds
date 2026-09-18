/**
 * Lifecycle Scheduler Module
 * Part of FB - Clean My Feeds
 *
 * Coordinates adaptive sleep duration loop, scroll debouncing,
 * popstate/history navigation detection, URL change detection,
 * and delegates mopping actions to appropriate feed cleaners.
 *
 * @module modules/lifecycle/scheduler
 */

/**
 * Calculates adaptive sleep duration based on no-change loop iterations.
 *
 * @param {number} noChangeCounter - Consecutive loops without DOM changes
 * @returns {number} Sleep duration in milliseconds
 */
export function calculateSleepDuration(noChangeCounter) {
  if (noChangeCounter < 16) return 50;
  if (noChangeCounter < 31) return 75;
  if (noChangeCounter < 46) return 100;
  if (noChangeCounter < 61) return 150;
  return 1000;
}

/**
 * Creates and initializes the lifecycle scheduler for feed processing.
 *
 * @param {Object} options
 * @param {Object} options.VARS - Application state
 * @param {Function} options.setFeedSettings - Feed route detector
 * @param {Object} options.cleaners - Map of feed cleaner functions
 * @param {Window} [options.windowObj=window] - Browser window object
 * @returns {Object} Scheduler instance with { start, stop, processPage }
 */
export function createScheduler({
  VARS,
  setFeedSettings,
  cleaners,
  windowObj = typeof window !== 'undefined' ? window : null
}) {
  let prevScrollY = windowObj?.scrollY ?? 0;
  let lastCleaningTime = 0;
  let sleepDuration = 50;
  let timerId = null;
  let intervalId = null;

  function processPage(eventType = 'timing') {
    const currentTime = new Date().getTime();
    const elapsedTime = currentTime - lastCleaningTime;

    if (eventType === 'url-changed') {
      setFeedSettings();
    } else if (eventType === 'scrolling') {
      // Wake-up on scroll
    } else if (elapsedTime < sleepDuration) {
      return;
    }

    // Delegate to active feed cleaner
    if (VARS.isNF) {
      cleaners.mopUpTheNewsFeed?.();
    } else if (VARS.isGF) {
      cleaners.mopUpTheGroupsFeed?.();
    } else if (VARS.isVF) {
      cleaners.mopUpTheWatchVideosFeed?.();
    } else if (VARS.isMF) {
      cleaners.mopUpTheMarketplaceFeed?.();
    } else if (VARS.isSF) {
      cleaners.mopUpTheSearchFeed?.();
    } else if (VARS.isRF) {
      cleaners.mopUpTheReelFeed?.('sleeping');
    } else if (VARS.isPP) {
      cleaners.mopUpTheProfilePage?.();
    }

    if (VARS.isAF) {
      sleepDuration = calculateSleepDuration(VARS.noChangeCounter);
    }

    lastCleaningTime = currentTime;
    if (windowObj?.setTimeout) {
      timerId = windowObj.setTimeout(processPage, sleepDuration);
    }
  }

  function start() {
    if (!windowObj) return;

    windowObj.addEventListener?.('scroll', () => {
      const currentScrollY = windowObj.scrollY;
      const scrollingDistance = Math.abs(currentScrollY - prevScrollY);
      if (scrollingDistance > 20) {
        prevScrollY = currentScrollY;
        processPage('scrolling');
      }
    });

    windowObj.addEventListener?.('popstate', () => {
      processPage('url-changed');
    });

    if (windowObj.setInterval) {
      intervalId = windowObj.setInterval(() => {
        if (VARS.prevURL !== windowObj.location?.href) {
          processPage('url-changed');
        }
      }, 500);
    }

    processPage('url-changed');
  }

  function stop() {
    if (windowObj && intervalId && windowObj.clearInterval) {
      windowObj.clearInterval(intervalId);
      intervalId = null;
    }
    if (windowObj && timerId && windowObj.clearTimeout) {
      windowObj.clearTimeout(timerId);
      timerId = null;
    }
  }

  return {
    start,
    stop,
    processPage
  };
}
