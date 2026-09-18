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
 * Calculates adaptive sleep duration based on consecutive no-change loop iterations.
 *
 * ## Sleep Ramping Algorithm
 * To achieve both instantaneous response times during active user browsing and minimal CPU/battery
 * usage when reading or idle, the scheduler dynamically steps through delay tiers:
 * - 0 - 15 clean ticks: **50ms** (fast polling immediately after page render or scroll)
 * - 16 - 30 clean ticks: **75ms**
 * - 31 - 45 clean ticks: **100ms**
 * - 46 - 60 clean ticks: **150ms**
 * - 61+ clean ticks: **1000ms** (idle standby mode)
 *
 * Any DOM mutation that modifies `innerHTML.length` by >= 16 characters or a user scroll
 * event > 20px immediately resets `noChangeCounter` back to 0, snapping the loop back to 50ms.
 *
 * @param {number} noChangeCounter - Number of consecutive iterations without structural DOM changes
 * @returns {number} Sleep interval in milliseconds before the next check
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
 * ## Lifecycle & Event Triggers
 * 1. **Adaptive Timing Loop**: Uses recursive `setTimeout` whose delay is calculated by `calculateSleepDuration`.
 * 2. **Scroll Wake-Up**: Listens for window `scroll` events. If delta Y exceeds 20px, interrupts idle sleep
 *    and immediately executes `processPage('scrolling')`.
 * 3. **History Navigation (`popstate`)**: Reacts to browser back/forward buttons, triggering route re-evaluation.
 * 4. **SPA URL Polling**: Facebook uses HTML5 `history.pushState` without firing standard page loads.
 *    A lightweight 500ms `setInterval` compares `VARS.prevURL` to `window.location.href` to catch client-side
 *    transitions (e.g. clicking from News Feed to Marketplace or Groups).
 *
 * @param {Object} options - Configuration and dependencies
 * @param {Object} options.VARS - Shared mutable state
 * @param {Function} options.setFeedSettings - Route detector that parses URL and updates boolean flags
 * @param {Object} options.cleaners - Map of feed cleaner functions bound to current context
 * @param {Window} [options.windowObj=window] - Browser window object
 * @returns {Object} Scheduler controller instance with `{ start, stop, processPage }`
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

  /**
   * Main execution cycle evaluating URL state and invoking the active feed cleaner.
   *
   * @param {string} [eventType='timing'] - Trigger source: 'url-changed', 'scrolling', or 'timing'
   */
  function processPage(eventType = 'timing') {
    const currentTime = new Date().getTime();
    const elapsedTime = currentTime - lastCleaningTime;

    if (eventType === 'url-changed') {
      // Re-evaluate current URL route flags
      setFeedSettings();
    } else if (eventType === 'scrolling') {
      // Immediate wake-up on scroll: bypass elapsed time throttle
    } else if (elapsedTime < sleepDuration) {
      return;
    }

    // Delegate processing to the cleaner matching current route flags
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

    // If currently on an active Facebook feed, calculate next adaptive sleep duration
    if (VARS.isAF) {
      sleepDuration = calculateSleepDuration(VARS.noChangeCounter);
    }

    lastCleaningTime = currentTime;
    if (windowObj?.setTimeout) {
      timerId = windowObj.setTimeout(processPage, sleepDuration);
    }
  }

  /**
   * Starts the background scheduler, binding scroll, popstate, and SPA URL poll listeners.
   */
  function start() {
    if (!windowObj) return;

    // Scroll listener with 20px threshold to wake up from idle sleep
    windowObj.addEventListener?.('scroll', () => {
      const currentScrollY = windowObj.scrollY;
      const scrollingDistance = Math.abs(currentScrollY - prevScrollY);
      if (scrollingDistance > 20) {
        prevScrollY = currentScrollY;
        processPage('scrolling');
      }
    });

    // Browser back/forward navigation
    windowObj.addEventListener?.('popstate', () => {
      processPage('url-changed');
    });

    // SPA client-side pushState detection polling (500ms)
    if (windowObj.setInterval) {
      intervalId = windowObj.setInterval(() => {
        if (VARS.prevURL !== windowObj.location?.href) {
          processPage('url-changed');
        }
      }, 500);
    }

    // Initial boot tick
    processPage('url-changed');
  }

  /**
   * Stops the scheduler, clearing active intervals and pending timeouts.
   */
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
