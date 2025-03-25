import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { configureForGitHubPages } from './configure-gh-pages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the dist directory
const distDir = path.resolve(__dirname, '../dist');

async function main() {
  try {
    console.log('Running GitHub Pages post-build configuration...');
    
    // Make sure the dist directory exists
    if (!fs.existsSync(distDir)) {
      console.error('Error: dist directory does not exist. Run vite build first.');
      process.exit(1);
    }
    
    // Configure for GitHub Pages
    await configureForGitHubPages();
    
    // Copy 404.html for SPA routing
    fs.copyFileSync(
      path.resolve(__dirname, '../client/public/404.html'),
      path.resolve(distDir, '404.html')
    );
    
    // Copy gh-pages-redirect.js for SPA routing
    fs.copyFileSync(
      path.resolve(__dirname, '../client/public/gh-pages-redirect.js'),
      path.resolve(distDir, 'gh-pages-redirect.js')
    );
    
    console.log('GitHub Pages post-build configuration completed successfully.');
  } catch (error) {
    console.error('Error during GitHub Pages post-build configuration:', error);
    process.exit(1);
  }
}

main();