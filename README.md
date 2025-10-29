# Facebook Clean My Feeds - TypeScript

A TypeScript-based userscript that hides sponsored and suggested posts from Facebook feeds. Built with Bun runtime and modern TypeScript features.

## Features

- 🚫 Hide sponsored posts
- 🚫 Hide suggested posts  
- 🚫 Hide marketplace posts
- 🚫 Hide groups posts
- 🚫 Hide watch videos posts
- 🎛️ Menu commands for toggling features
- 🐛 Debug mode for troubleshooting
- 📱 Works on all Facebook domains

## Development

### Prerequisites

- [Bun](https://bun.sh/) runtime
- TypeScript 5.9.3+

### Setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Build the userscript:
   ```bash
   bun run build
   ```

3. Watch for changes during development:
   ```bash
   bun run dev
   ```

### Project Structure

```
src/
├── index.ts                 # Main userscript code
├── userscript-header.txt    # UserScript metadata
└── types/                   # Type definitions (if needed)

scripts/
└── build-userscript.js      # Build script

dist/
└── fb-clean-my-feeds.user.js # Built userscript
```

### Build Process

The build process:
1. Compiles TypeScript with Bun
2. Preserves UserScript metadata headers
3. Outputs a single `.user.js` file ready for installation

### TypeScript Features

- Full TypeScript support with strict mode
- Greasemonkey API types
- Modern ES2022 target
- DOM types included
- Vanilla JavaScript compatibility

## Installation

1. Install a userscript manager (Tampermonkey, Greasemonkey, etc.)
2. Install the built userscript from `dist/fb-clean-my-feeds.user.js`
3. Visit Facebook and the script will automatically run

## Usage

The userscript provides menu commands accessible through your userscript manager:
- Toggle Sponsored Posts
- Toggle Suggested Posts  
- Toggle Debug Mode
- Reload Script

## Development Notes

- The `legacy/` directory is preserved and not modified
- All source code is in the `src/` directory
- TypeScript allows vanilla JavaScript for legacy compatibility
- UserScript headers are preserved during build
- Bun is used for fast compilation and bundling
