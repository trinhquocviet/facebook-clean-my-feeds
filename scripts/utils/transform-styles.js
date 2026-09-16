import { objectToCss } from '../../src/utils/css-builder.js';

/**
 * Transforms JavaScript source code by finding `styles: { ... }` object literals
 * and converting them into static single-line CSS string literals `styles: "..."`.
 *
 * @param {string} source - JavaScript source code.
 * @returns {string} Transformed source code with style objects converted to single-line CSS strings.
 */
export function transformStyleObjects(source) {
  let result = '';
  let i = 0;
  const target = 'styles:';

  while (i < source.length) {
    const idx = source.indexOf(target, i);
    if (idx === -1) {
      result += source.slice(i);
      break;
    }

    result += source.slice(i, idx + target.length);
    i = idx + target.length;

    // Skip whitespace
    while (i < source.length && /\s/.test(source[i])) {
      result += source[i];
      i++;
    }

    // Check if next char is '{'
    if (source[i] === '{') {
      const start = i;
      let depth = 0;
      let inString = false;
      let stringChar = '';
      let escaped = false;

      while (i < source.length) {
        const char = source[i];

        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (inString) {
          if (char === stringChar) {
            inString = false;
          }
        } else if (char === '"' || char === "'" || char === '`') {
          inString = true;
          stringChar = char;
        } else if (char === '{') {
          depth++;
        } else if (char === '}') {
          depth--;
          if (depth === 0) {
            i++; // include closing brace
            break;
          }
        }
        i++;
      }

      const objLiteral = source.slice(start, i);
      try {
        const evaluated = new Function(`return (${objLiteral});`)();
        if (typeof evaluated === 'object' && evaluated !== null) {
          const cssString = objectToCss(evaluated);
          result += JSON.stringify(cssString);
          continue;
        }
      } catch (err) {
        // Fallback if not evaluable at build time
      }
      result += objLiteral;
    }
  }

  return result;
}
