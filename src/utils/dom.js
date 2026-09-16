/**
 * DOM query, traversal, and mutation observation utilities.
 * @module utils/dom
 */

/**
 * Traverses up the DOM hierarchy by a specified number of parent node levels.
 *
 * @param {Node|Element|null} element - Starting DOM element or node.
 * @param {number} [numberOfBranches=1] - Number of parent levels to traverse upwards.
 * @returns {Element|Node|null} Ancestor element, or null if root is exceeded.
 *
 * @example
 * climbUpTheTree(childSpan, 2); // returns grandchild's grandparent
 */
export function climbUpTheTree(element, numberOfBranches = 1) {
  let current = element;
  let remainingBranches = numberOfBranches;

  while (current && remainingBranches > 0) {
    current = current.parentNode;
    remainingBranches--;
  }

  return current || null;
}

/**
 * Counts the number of descendant elements inside a container matching a CSS selector.
 *
 * @param {Element|null} element - The container element to inspect.
 * @param {string} [selector='div, span'] - CSS selector for descendant elements.
 * @returns {number} The count of matching descendant elements.
 *
 * @example
 * countDescendants(postContainer); // returns count of 'div, span'
 */
export function countDescendants(element, selector = 'div, span') {
  if (!element || typeof element.querySelectorAll !== 'function') {
    return 0;
  }
  return element.querySelectorAll(selector).length;
}

/**
 * Queries the DOM for elements that match one or more selectors and have no children (leaf nodes)
 * with textContent length meeting or exceeding minText.
 *
 * @param {ParentNode} [container=document] - Root container to search within.
 * @param {string|string[]} [queries=[]] - CSS selector(s) to query.
 * @param {number} [minText=0] - Minimum textContent length required.
 * @param {boolean} [executeAllQueries=false] - Whether to return all matches or stop at first match.
 * @returns {Element[]} Array of matching leaf DOM elements.
 *
 * @example
 * querySelectorAllNoChildren(post, ['span[dir="auto"]'], 1);
 */
export function querySelectorAllNoChildren(container = (typeof document !== 'undefined' ? document : null), queries = [], minText = 0, executeAllQueries = false) {
  if (!container || typeof container.querySelectorAll !== 'function') {
    return [];
  }

  if (!queries || (Array.isArray(queries) && queries.length === 0)) {
    return [];
  }

  const queryList = Array.isArray(queries) ? queries.filter(Boolean) : [queries];
  if (queryList.length === 0) {
    return [];
  }

  if (executeAllQueries) {
    const combinedSelector = queryList.join(',');
    const elements = Array.from(container.querySelectorAll(combinedSelector));
    return elements.filter((el) => {
      return el.children.length === 0 && (el.textContent || '').length >= minText;
    });
  }

  for (const query of queryList) {
    const elements = container.querySelectorAll(query);
    for (const element of elements) {
      if (element.children.length === 0 && (element.textContent || '').length >= minText) {
        return [element];
      }
    }
  }

  return [];
}

/**
 * Compares two numerical values (typically innerHTML length or element count)
 * to determine if the change exceeds a tolerance threshold.
 * Used to avoid unnecessary DOM reflows and mopping loops caused by minor FB DOM noise.
 *
 * @param {number|string} oldValue - Previous size/length value.
 * @param {number|string} newValue - Current size/length value.
 * @param {number} [tolerance=16] - Minimum difference required to trigger change.
 * @returns {boolean} True if the absolute difference exceeds tolerance.
 *
 * @example
 * hasSizeChanged(1000, 1005); // false (within tolerance 16)
 * hasSizeChanged(1000, 1025); // true (exceeds tolerance 16)
 */
export function hasSizeChanged(oldValue, newValue, tolerance = 16) {
  const oldNum = parseInt(oldValue, 10);
  const newNum = parseInt(newValue, 10);

  if (isNaN(oldNum) || isNaN(newNum)) {
    return false;
  }

  return Math.abs(newNum - oldNum) > tolerance;
}

/**
 * Removes decoy/obfuscation elements (e.g. [data-0="0"]) from a post DOM element.
 * Tracks loop scan count directly on the element using an expando property to prevent
 * redundant DOM queries once the maximum scan threshold has been reached.
 *
 * @param {Element|null} post - The post container DOM element.
 * @param {Object} [options={}] - Configuration options.
 * @param {string} [options.propDS='cmf_dusted'] - Expando property key for tracking scans.
 * @param {number} [options.scanCountStart=0] - Initial scan count value.
 * @param {number} [options.scanCountMaxLoop=15] - Maximum scan loops before skipping.
 * @param {string} [options.selector='[data-0="0"]'] - CSS selector for decoy elements.
 * @returns {number} Number of elements removed, or 0 if skipped or invalid.
 *
 * @example
 * removeDustyElements(postElement, { propDS: 'cmf_dusted', scanCountMaxLoop: 15 });
 */
export function removeDustyElements(post, options = {}) {
  if (!post || typeof post.querySelectorAll !== 'function') {
    return 0;
  }

  const propDS = options.propDS || 'cmf_dusted';
  const scanCountStart = options.scanCountStart ?? 0;
  const scanCountMaxLoop = options.scanCountMaxLoop ?? 15;
  const selector = options.selector || '[data-0="0"]';

  const currentProp = post[propDS];
  let scanCount = scanCountStart;

  if (currentProp !== undefined) {
    const parsed = typeof currentProp === 'number' ? currentProp : parseInt(currentProp, 10);
    scanCount = Number.isNaN(parsed) || parsed < scanCountStart ? scanCountStart : parsed;
  }

  if (scanCount >= scanCountMaxLoop) {
    return 0;
  }

  const dustySpots = post.querySelectorAll(selector);
  const count = dustySpots.length;

  if (count > 0) {
    for (let i = 0; i < count; i++) {
      dustySpots[i].remove();
    }
  }

  post[propDS] = scanCount + 1;
  return count;
}

