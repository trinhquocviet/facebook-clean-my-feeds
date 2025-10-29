#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Configuration
const SRC_FILE = join(projectRoot, 'src', 'index.ts');
const OUTPUT_FILE = join(projectRoot, 'dist', 'fb-clean-my-feeds.user.js');
const HEADER_FILE = join(projectRoot, 'src', 'userscript-header.txt');

// Ensure dist directory exists
const distDir = join(projectRoot, 'dist');
if (!existsSync(distDir)) {
  execSync(`mkdir -p "${distDir}"`, { stdio: 'inherit' });
}

// Read userscript header
let header = '';
if (existsSync(HEADER_FILE)) {
  header = readFileSync(HEADER_FILE, 'utf-8');
} else {
  // Fallback header if file doesn't exist
  header = `// ==UserScript==
// @name         FB - Clean my feeds - TypeScript
// @description  Hide Sponsored and Suggested posts in FB's News Feed
// @namespace    https://github.com/trinhquocviet/facebook-clean-my-feeds
// @version      1.0.0
// @author       trinhquocviet
// @match        https://www.facebook.com/*
// @match        https://web.facebook.com/*
// @match        https://facebook.com/*
// @noframes
// @grant        GM.registerMenuCommand
// @grant        GM.info
// @grant        unsafeWindow
// @license      MIT
// @run-at       document-start
// ==/UserScript==
`;
}

// Build with Bun
console.log('Building userscript with Bun...');
try {
  const buildCommand = `bun build "${SRC_FILE}" --outfile "${OUTPUT_FILE}" --target browser`; // add --minify to minify
  execSync(buildCommand, { 
    stdio: 'inherit',
    cwd: projectRoot 
  });
  
  // Read the built file
  let builtContent = readFileSync(OUTPUT_FILE, 'utf-8');
  
  // Prepend the userscript header
  const finalContent = header + '\n' + builtContent;
  
  // Write the final userscript
  writeFileSync(OUTPUT_FILE, finalContent);
  
  console.log(`✅ Userscript built successfully: ${OUTPUT_FILE}`);
  console.log(`📦 File size: ${(finalContent.length / 1024).toFixed(2)} KB`);
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
