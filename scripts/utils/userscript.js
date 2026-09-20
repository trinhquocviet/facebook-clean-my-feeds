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

/**
 * Strip leading 'v' or 'refs/tags/' prefix and whitespace from a version/tag string.
 * @param {string} versionStr
 * @returns {string}
 */
export function cleanVersion(versionStr) {
  if (!versionStr || typeof versionStr !== 'string') return '';
  return versionStr
    .trim()
    .replace(/^refs\/tags\//i, '')
    .replace(/^v/i, '')
    .trim();
}

/**
 * Resolve target userscript version dynamically:
 * 1. CLI argument (--version <ver>, -v <ver>, or --version=<ver>)
 * 2. Explicit environment variables (USERSCRIPT_VERSION or BUILD_VERSION)
 * 3. GitHub Actions tag environment (GITHUB_REF_NAME when GITHUB_REF_TYPE === 'tag' or GITHUB_REF)
 * 4. Git exact tag on current commit (git describe --tags --exact-match)
 * 5. Default fallback (e.g. package.json version)
 *
 * @param {string} [defaultVersion]
 * @param {object} [options]
 * @param {string[]} [options.argv]
 * @param {Record<string, string>} [options.env]
 * @param {() => string} [options.getGitTag]
 * @returns {string}
 */
export function resolveTargetVersion(defaultVersion = '', options = {}) {
  const argv = options.argv || (typeof process !== 'undefined' ? process.argv.slice(2) : []);
  const env = options.env || (typeof process !== 'undefined' ? process.env : {});

  // 1. CLI argument
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--version' || arg === '-v') {
      if (argv[i + 1]) {
        return cleanVersion(argv[i + 1]);
      }
    }
    if (arg.startsWith('--version=')) {
      return cleanVersion(arg.slice(10));
    }
  }

  // 2. Explicit environment variables
  if (env.USERSCRIPT_VERSION) {
    return cleanVersion(env.USERSCRIPT_VERSION);
  }
  if (env.BUILD_VERSION) {
    return cleanVersion(env.BUILD_VERSION);
  }

  // 3. GitHub Actions tag environment
  if (env.GITHUB_REF_TYPE === 'tag' && env.GITHUB_REF_NAME) {
    return cleanVersion(env.GITHUB_REF_NAME);
  }
  if (env.GITHUB_REF && env.GITHUB_REF.startsWith('refs/tags/')) {
    return cleanVersion(env.GITHUB_REF);
  }

  // 4. Git exact tag on current commit
  if (typeof options.getGitTag === 'function') {
    const customTag = options.getGitTag();
    if (customTag) return cleanVersion(customTag);
  } else if (typeof Bun !== 'undefined' && Bun.spawnSync) {
    try {
      const proc = Bun.spawnSync(['git', 'describe', '--tags', '--exact-match'], {
        stderr: 'pipe',
      });
      if (proc.exitCode === 0) {
        const tag = proc.stdout.toString().trim();
        if (tag) return cleanVersion(tag);
      }
    } catch {
      // Git command failed or untagged
    }
  }

  // 5. Default fallback
  return cleanVersion(defaultVersion);
}

