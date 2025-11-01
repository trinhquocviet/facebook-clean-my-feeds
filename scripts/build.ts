#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { generateUserscriptHeader } from './utils/userscript';
import packagesJson from '../package.json';

const { userscript: userscriptJson } = packagesJson;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Configuration
const SRC_FILE = join(projectRoot, 'src', 'index.ts');
const OUTPUT_DIR = join(projectRoot, 'dist');
const OUTPUT_FILE = join(OUTPUT_DIR, 'fb-clean-my-feeds.user.js');

// Ensure dist directory exists
const distDir = join(projectRoot, 'dist');
if (!existsSync(distDir)) {
  execSync(`mkdir -p "${distDir}"`, { stdio: 'inherit' });
}

// Build with Bun
console.log('Building userscript with Bun...');
try {
  const result = await Bun.build({
    entrypoints: [SRC_FILE], 
    outdir: OUTPUT_DIR, 
    naming: { entry: 'fb-clean-my-feeds.user.js' },
    target: 'browser', 
    define: {
    },
    minify: false, 
  });
  
  if (result.success) {
    console.log('Adding userscript header...');
    // Read the built file
    let builtContent = readFileSync(OUTPUT_FILE, 'utf-8');
    
    // Prepend the userscript header
    const header = generateUserscriptHeader(userscriptJson);
    const finalContent = header + '\n' + builtContent;
    
    // Write the final userscript
    writeFileSync(OUTPUT_FILE, finalContent);
    
    console.log(`✅ Userscript built successfully: ${OUTPUT_FILE}`);
    console.log(`📦 File size: ${(finalContent.length / 1024).toFixed(2)} KB`);
  }
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
