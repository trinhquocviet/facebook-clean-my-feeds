/**
 * CSS rule formatting and stylesheet generation utilities.
 * @module utils/css
 */

/**
 * Builds and formats a CSS rule string from comma-separated selectors and semicolon-separated declarations.
 *
 * @param {string} classes - Comma-separated list of CSS selectors.
 * @param {string} styles - Semicolon-separated CSS declarations (e.g. 'display: none; opacity: 0').
 * @returns {string} Formatted CSS rule block, or empty string if inputs are empty.
 *
 * @example
 * buildCssRule('.hidden-post, .sponsored', 'display: none; opacity: 0');
 * // returns:
 * // .hidden-post,
 * // .sponsored {
 * //     display:none;
 * //     opacity:0;
 * // }
 */
export function buildCssRule(classes, styles) {
  if (typeof classes !== 'string' || typeof styles !== 'string') {
    return '';
  }

  const listOfClasses = classes
    .split(',')
    .map(e => e.trim())
    .filter(Boolean);

  if (listOfClasses.length === 0) {
    return '';
  }

  const rawStyleLines = styles
    .split(';')
    .map(e => e.trim())
    .filter(Boolean);

  const formattedStyles = rawStyleLines.map(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) {
      return `    ${line}`;
    }
    const prop = line.slice(0, colonIndex).trim();
    const val = line.slice(colonIndex + 1).trim();
    return `    ${prop}:${val}`;
  });

  if (formattedStyles.length === 0) {
    return '';
  }

  let rule = listOfClasses.join(',\n') + ' {\n';
  rule += formattedStyles.join(';\n') + ';\n';
  rule += '}\n';

  return rule;
}
