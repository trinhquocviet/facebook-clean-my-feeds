/**
 * Batch CSS stylesheet builder.
 * Replaces per-rule buildCssRule() with a single-pass array.join() approach.
 * @module utils/css-builder
 */

/**
 * Builds a complete CSS stylesheet string from an array of rule objects.
 * Uses array push + join for O(1) amortized concatenation instead of O(n) string concat.
 *
 * @param {{ selector: string, styles: string }[]} rules - Array of CSS rule definitions.
 * @param {{ merge?: boolean }} [options] - If merge=true, combine styles for duplicate selectors.
 * @returns {string} Complete CSS text ready for injection.
 *
 * @example
 * buildStylesheet([
 *   { selector: '.hidden', styles: 'display: none;' },
 *   { selector: '.visible', styles: 'display: block; opacity: 1;' },
 * ]);
 * // => ".hidden { display: none; }\n.visible { display: block; opacity: 1; }"
 */
export function buildStylesheet(rules, { merge = false } = {}) {
  if (!Array.isArray(rules) || rules.length === 0) {
    return '';
  }

  if (merge) {
    const map = new Map();
    for (const rule of rules) {
      if (!rule || typeof rule.selector !== 'string' || typeof rule.styles !== 'string') continue;
      const key = rule.selector.trim();
      const val = rule.styles.trim();
      if (key.length === 0 || val.length === 0) continue;
      const existing = map.get(key) || '';
      map.set(key, existing ? `${existing} ${val}` : val);
    }
    const parts = [];
    for (const [sel, styles] of map) {
      parts.push(`${sel} { ${styles} }`);
    }
    return parts.join('\n');
  }

  const parts = [];
  for (const rule of rules) {
    if (!rule || typeof rule.selector !== 'string' || typeof rule.styles !== 'string') continue;
    const key = rule.selector.trim();
    const val = rule.styles.trim();
    if (key.length > 0 && val.length > 0) {
      parts.push(`${key} { ${val} }`);
    }
  }
  return parts.join('\n');
}
