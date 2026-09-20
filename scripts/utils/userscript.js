/**
 * Standard Userscript metadata tag ordering for clean, conventional headers.
 */
const STANDARD_METADATA_ORDER = [
  'name',
  'description',
  'namespace',
  'homepageURL',
  'supportURL',
  'downloadURL',
  'updateURL',
  'version',
  'author',
  'match',
  'noframes',
  'grant',
  'license',
  'icon',
  'icon64',
  'run-at'
];

/**
 * Generate UserScript metadata block from configuration object.
 * Formats metadata tags with standardized column alignment.
 * 
 * If version is not explicitly defined in userscriptJson, it falls back
 * to defaultVersion (e.g. from package.json version).
 * 
 * @param {Record<string, string | string[] | boolean>} userscriptJson
 * @param {string} [defaultVersion]
 * @returns {string}
 */
export function generateUserscriptHeader(userscriptJson, defaultVersion) {
  if (!userscriptJson || typeof userscriptJson !== 'object') {
    return '';
  }

  const metadata = { ...userscriptJson };

  // Take reference from package.json version if not explicitly set in userscript object
  if (!metadata.version && defaultVersion) {
    metadata.version = defaultVersion;
  }

  // Order tags conventionally, appending any custom tags at the end
  const keys = [
    ...STANDARD_METADATA_ORDER.filter((key) => key in metadata),
    ...Object.keys(metadata).filter((key) => !STANDARD_METADATA_ORDER.includes(key))
  ];

  const headerLines = [];
  headerLines.push('// ==UserScript==');

  for (const key of keys) {
    const value = metadata[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        headerLines.push(`// @${key.padEnd(14, ' ')} ${item}`);
      }
      continue;
    }

    if (value === '' || value === true) {
      headerLines.push(`// @${key}`);
      continue;
    }

    if (value === false || value === null || value === undefined) {
      continue;
    }

    headerLines.push(`// @${key.padEnd(14, ' ')} ${value}`);
  }

  headerLines.push('// ==/UserScript==\n');
  return headerLines.join('\n');
}
