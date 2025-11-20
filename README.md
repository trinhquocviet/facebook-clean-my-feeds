# Facebook Clean My Feeds - TypeScript

A TypeScript-based userscript that hides sponsored and suggested posts from Facebook feeds. Built with Bun runtime and modern TypeScript features.

## Features

- 🚫 Hide sponsored posts
- 🚫 Hide suggested posts
- 🚫 Hide marketplace posts
- 🚫 Hide groups posts
- 🚫 Hide watch videos posts
- 🎛️ Configurable settings modal to toggle features on and off
- 🐛 Debug mode for troubleshooting
- 📱 Works on all Facebook domains

## Development

### Prerequisites

- [Bun](https://bun.sh/) runtime

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
src/
├── index.ts                 # Main userscript entry point
├── components/              # UI components (e.g., settings modal)
├── constants/               # Constants (e.g., images)
├── modules/                 # Core modules (e.g., feed settings, master keywords)
├── utils/                   # Utility functions
└── global.d.ts              # Global type definitions

scripts/
├── build.ts                 # Build script
└── watch.ts                 # Watch script for development

dist/
└── fb-clean-my-feeds.user.js # Built userscript

```
├───dist/
│   ├───fb-clean-my-feeds.user.js # Built userscript
├───legacy/
├───scripts/
│   ├───build.ts                  # Build script
│   ├───watch.ts                  # Watch script for development
└───src/
│   ├── index.ts                  # Main userscript entry point
│   ├── components/               # UI components (e.g., settings modal)
│   ├── constants/                # Constants (e.g., images)
│   ├── modules/                  # Core modules (e.g., feed settings, master keywords)
│   ├── utils/                    # Utility functions
│   └── global.d.ts               # Global type definitions
```

### Build Process

The build process:
1. Compiles TypeScript with Bun
2. Preserves UserScript metadata headers
3. Outputs a single `.user.js` file ready for installation

## Installation

1. Install a userscript manager (e.g., [Tampermonkey](https://www.tampermonkey.net/), [Greasemonkey](https://www.greasespot.net/))
2. Install the built userscript from `dist/fb-clean-my-feeds.user.js`
3. Visit Facebook and the script will automatically run

## Usage

The userscript adds a "Clean My Feeds" button to the Facebook header. Clicking this button opens a settings modal where you can configure which types of posts to hide.

## Development Notes

- The `legacy/` directory contains the old JavaScript version of the script and is not actively developed.
- All new development happens in the `src/` directory.
- The project is built with [Bun](https://bun.sh), a fast all-in-one JavaScript runtime.