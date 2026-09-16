/**
 * Converts a style object with camelCase properties and CSS custom properties
 * into a minified, single-line CSS declaration string.
 *
 * @param {Record<string, string | number> | string} styles
 * @returns {string} Single-line CSS text without newlines or redundant spaces.
 *
 * @example
 * objectToCss({
 *   backgroundColor: "#1a1a1a",
 *   color: "#ffffff",
 *   padding: "20px",
 *   borderRadius: "8px"
 * });
 * // => "background-color: #1a1a1a; color: #ffffff; padding: 20px; border-radius: 8px;"
 */
export function objectToCss(styles) {
  if (!styles) return '';
  if (typeof styles === 'string') {
    return styles.replace(/\s*\n\s*/g, ' ').trim();
  }
  if (typeof styles !== 'object') return '';

  const parts = [];
  for (const [key, val] of Object.entries(styles)) {
    if (val === undefined || val === null || val === '') continue;
    // Preserve custom properties (--cmf-*); convert camelCase to kebab-case
    const prop = key.startsWith('--')
      ? key
      : key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
    parts.push(`${prop}: ${val};`);
  }
  return parts.join(' ');
}

/**
 * Normalizes an array of CSS rule objects so any `styles` defined as an object
 * is converted to a clean, single-line CSS declaration string.
 *
 * @param {{ selector: string, styles: Record<string, any> | string }[]} rules
 * @returns {{ selector: string, styles: string }[]}
 */
export function compileRules(rules) {
  if (!Array.isArray(rules)) return [];
  return rules
    .filter((rule) => rule && typeof rule.selector === 'string')
    .map((rule) => {
      const styles = typeof rule.styles === 'object' && rule.styles !== null
        ? objectToCss(rule.styles)
        : (typeof rule.styles === 'string' ? rule.styles.replace(/\s*\n\s*/g, ' ').trim() : '');
      return {
        ...rule,
        styles,
      };
    });
}

/**
 * Builds a complete CSS stylesheet string from an array of rule definitions.
 * Supports both string styles and style objects.
 * Uses array push + join for O(1) amortized concatenation instead of O(n) string concat.
 *
 * @param {{ selector: string, styles: string | Record<string, any> }[]} rules - Array of CSS rule definitions.
 * @param {{ merge?: boolean }} [options] - If merge=true, combine styles for duplicate selectors.
 * @returns {string} Complete CSS text ready for injection.
 */
export function buildStylesheet(rules, { merge = false } = {}) {
  if (!Array.isArray(rules) || rules.length === 0) {
    return '';
  }

  if (merge) {
    const map = new Map();
    for (const rule of rules) {
      if (!rule || typeof rule.selector !== 'string') continue;
      const key = rule.selector.trim();
      const val = typeof rule.styles === 'object' && rule.styles !== null
        ? objectToCss(rule.styles)
        : (typeof rule.styles === 'string' ? rule.styles.replace(/\s*\n\s*/g, ' ').trim() : '');
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
    if (!rule || typeof rule.selector !== 'string') continue;
    const key = rule.selector.trim();
    const val = typeof rule.styles === 'object' && rule.styles !== null
      ? objectToCss(rule.styles)
      : (typeof rule.styles === 'string' ? rule.styles.replace(/\s*\n\s*/g, ' ').trim() : '');
    if (key.length > 0 && val.length > 0) {
      parts.push(`${key} { ${val} }`);
    }
  }
  return parts.join('\n');
}
