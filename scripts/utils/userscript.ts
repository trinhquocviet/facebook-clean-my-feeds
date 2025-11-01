export function generateUserscriptHeader(userscriptJson) {
  if (userscriptJson === undefined || userscriptJson === null) {
    return '';
  }

  const headerLines: Array<string> = [];
  // 
  headerLines.push('// ==UserScript==');
  for (const [key, value] of Object.entries(userscriptJson)) {
    if (Array.isArray(value)) {
      value.forEach(item => {
        headerLines.push(`// @${key} ${item}`);
      });
      continue;
    }

    headerLines.push(`// @${key} ${value}`);
  }
  headerLines.push('// ==/UserScript==\n');
  // 
  return headerLines.join('\n');
}