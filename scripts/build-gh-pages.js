import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the dist directory if it doesn't exist
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Copy the CNAME file to the dist directory if it exists
if (fs.existsSync('CNAME')) {
  fs.copyFileSync('CNAME', path.join('dist', 'CNAME'));
}

// Create API redirects for GitHub Pages
const createApiRedirects = () => {
  const apiDir = path.join('dist', 'api');
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
  }

  // Create a redirect.json file that explains API redirection
  fs.writeFileSync(
    path.join(apiDir, 'redirect-info.json'),
    JSON.stringify({ 
      message: 'API requests from GitHub Pages will be redirected to your backend server',
      backendUrl: process.env.VITE_API_BASE_URL || 'https://your-backend-server-url.com'
    })
  );
};

// Run the build process
console.log('Building for GitHub Pages deployment...');
try {
  // First, build the frontend with Vite
  console.log('Building frontend...');
  // Pass the base path for GitHub Pages to the build command
  execSync('npm run build -- --base=/HuskyMower/', { stdio: 'inherit' });
  
  // Create necessary files for GitHub Pages
  console.log('Creating GitHub Pages-specific files...');
  
  // Copy the 404.html (for SPA routing) to the dist directory
  if (fs.existsSync('client/public/404.html')) {
    fs.copyFileSync('client/public/404.html', path.join('dist', '404.html'));
  } else {
    console.warn('Warning: 404.html not found in client/public directory');
  }
  
  // Create API redirects information
  createApiRedirects();
  
  // Configure the build for GitHub Pages with base path settings
  console.log('Configuring for GitHub Pages...');
  // Use top-level await to make sure the configure script completes before continuing
  try {
    const configureFn = await import('./configure-gh-pages.js');
    await configureFn.default();
  } catch (err) {
    console.error('Failed to import configure-gh-pages.js:', err);
    process.exit(1);
  }
  
  console.log('Build complete for GitHub Pages deployment!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}