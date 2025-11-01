#!/usr/bin/env node

import { watch } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🔍 Watching for changes in src/ directory...');
console.log('📦 Building userscript on file changes...\n');

// Initial build
try {
  execSync('bun run build:userscript', { 
    stdio: 'inherit',
    cwd: projectRoot 
  });
} catch (error) {
  console.error('❌ Initial build failed:', error.message);
}

// Watch for changes
watch(join(projectRoot, 'src'), { recursive: true }, (eventType, filename) => {
  if (filename && (filename.endsWith('.ts') || filename.endsWith('.js'))) {
    console.log(`\n🔄 File changed: ${filename}`);
    
    try {
      execSync('bun run build:userscript', { 
        stdio: 'inherit',
        cwd: projectRoot 
      });
      console.log('✅ Build completed successfully\n');
    } catch (error) {
      console.error('❌ Build failed:', error.message);
    }
  }
});

console.log('Press Ctrl+C to stop watching...');
