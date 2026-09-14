#!/usr/bin/env bun

import { watch } from 'fs';
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const srcDir = join(projectRoot, 'src');

console.log('Watching for changes in src/ directory...');
console.log('Automatically building userscript on file modifications...\n');

let isBuilding = false;
let buildPending = false;
let debounceTimer = null;

function runBuild() {
  if (isBuilding) {
    buildPending = true;
    return;
  }

  isBuilding = true;
  buildPending = false;

  const buildProcess = spawn('bun', ['scripts/build.js'], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  buildProcess.on('close', (code) => {
    isBuilding = false;
    if (code === 0) {
      console.log('✨ Build finished. Waiting for changes...\n');
    } else {
      console.error(`Build exited with code ${code}\n`);
    }

    if (buildPending) {
      runBuild();
    }
  });

  buildProcess.on('error', (err) => {
    isBuilding = false;
    console.error('Failed to run build process:', err.message);
  });
}

// Perform initial build
runBuild();

// Watch for changes in src/
watch(srcDir, { recursive: true }, (eventType, filename) => {
  if (filename && filename.endsWith('.js')) {
    console.log(`[${eventType}] ${filename}`);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      runBuild();
    }, 150);
  }
});

console.log('Press Ctrl+C to exit watch mode.\n');
