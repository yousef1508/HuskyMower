// GitHub Pages build script
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the dist directory
const distDir = path.resolve(__dirname, '../dist/public');

// Environment configuration
const envVars = {
  VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY || '',
  VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID || '',
  VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID || '',
  AUTOMOWER_API_KEY: process.env.AUTOMOWER_API_KEY || '',
  AUTOMOWER_CLIENT_SECRET: process.env.AUTOMOWER_CLIENT_SECRET || '',
  // Add API base URL for production - this should point to your backend API
  VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || 'https://husky-mower.replit.app'
};

/**
 * Updates the index.html file to include runtime base path detection for GitHub Pages
 */
function updateIndexHtml() {
  console.log('Updating index.html for GitHub Pages...');
  
  const indexPath = path.join(distDir, 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    throw new Error(`${indexPath} does not exist`);
  }
  
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Add script to detect the base path at runtime and ensure proper asset paths
  const runtimeScript = `
    <script>
      // GitHub Pages dynamic base path detection and asset path correction
      (function() {
        window.ENV = window.ENV || {};
        
        // Set the repo name for GitHub Pages - hardcoded to match repository name
        var repoName = 'HuskyMower';
        
        // Check if we're on GitHub Pages (username.github.io/repo-name)
        if (window.location.hostname.includes('github.io')) {
          window.ENV.BASE_PATH = '/' + repoName;
          console.log('GitHub Pages detected, setting BASE_PATH to:', window.ENV.BASE_PATH);
          
          // Add base tag for relative URLs
          var baseTag = document.createElement('base');
          baseTag.href = window.ENV.BASE_PATH + '/';
          document.head.prepend(baseTag);
          
          // Fix for script and asset loading
          document.addEventListener('DOMContentLoaded', function() {
            // Fix script tags
            var scripts = document.querySelectorAll('script[src]');
            scripts.forEach(function(script) {
              if (script.src.startsWith(window.location.origin) && !script.src.includes('/' + repoName + '/')) {
                var newSrc = script.src.replace(window.location.origin, window.location.origin + '/' + repoName);
                script.src = newSrc;
              }
            });
            
            // Fix link tags
            var links = document.querySelectorAll('link[href]');
            links.forEach(function(link) {
              if (link.href.startsWith(window.location.origin) && !link.href.includes('/' + repoName + '/')) {
                var newHref = link.href.replace(window.location.origin, window.location.origin + '/' + repoName);
                link.href = newHref;
              }
            });
          });
        } else {
          window.ENV.BASE_PATH = '';
        }
      })();
    </script>
  `;
  
  // Insert the script right after the opening head tag
  content = content.replace('<head>', '<head>' + runtimeScript);
  
  // Add a specific base tag for GitHub Pages to ensure proper asset loading
  const baseTag = '<base href="/HuskyMower/">';
  content = content.replace('<head>', '<head>' + baseTag);
  
  // Write the updated content back to index.html
  fs.writeFileSync(indexPath, content);
  console.log('index.html updated successfully');
}

/**
 * Create a JavaScript file with environment variables for runtime configuration
 */
function createEnvConfig() {
  console.log('Creating runtime environment configuration...');
  
  const envConfigContent = `
// Runtime environment configuration
window.ENV = window.ENV || {};
// Firebase config - with and without VITE_ prefix for compatibility
window.ENV.FIREBASE_API_KEY = "${envVars.VITE_FIREBASE_API_KEY}";
window.ENV.FIREBASE_PROJECT_ID = "${envVars.VITE_FIREBASE_PROJECT_ID}";
window.ENV.FIREBASE_APP_ID = "${envVars.VITE_FIREBASE_APP_ID}";
window.ENV.VITE_FIREBASE_API_KEY = "${envVars.VITE_FIREBASE_API_KEY}";
window.ENV.VITE_FIREBASE_PROJECT_ID = "${envVars.VITE_FIREBASE_PROJECT_ID}";
window.ENV.VITE_FIREBASE_APP_ID = "${envVars.VITE_FIREBASE_APP_ID}";

// Other environment variables
window.ENV.AUTOMOWER_API_KEY = "${envVars.AUTOMOWER_API_KEY}";
window.ENV.AUTOMOWER_CLIENT_SECRET = "${envVars.AUTOMOWER_CLIENT_SECRET}";
window.ENV.API_BASE_URL = "${envVars.VITE_API_BASE_URL}";
window.ENV.VITE_API_BASE_URL = "${envVars.VITE_API_BASE_URL}";

console.log('Runtime environment configuration loaded:', {
  FIREBASE_PROJECT_ID: window.ENV.FIREBASE_PROJECT_ID,
  API_BASE_URL: window.ENV.API_BASE_URL,
  // Don't log API keys for security
  FIREBASE_API_KEY_SET: !!window.ENV.FIREBASE_API_KEY,
  FIREBASE_APP_ID_SET: !!window.ENV.FIREBASE_APP_ID
});
`;
  
  // Write the runtime environment configuration file
  fs.writeFileSync(path.join(distDir, 'env-config.js'), envConfigContent);
  
  // Update index.html to include the env-config.js script
  const indexPath = path.join(distDir, 'index.html');
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Add the script just before the closing head tag
  indexContent = indexContent.replace('</head>', '<script src="env-config.js"></script></head>');
  
  // Write the updated content back to index.html
  fs.writeFileSync(indexPath, indexContent);
  
  console.log('Runtime environment configuration created successfully');
}

/**
 * Copy and create static files needed for GitHub Pages
 */
function copyStaticFiles() {
  console.log('Copying static files for GitHub Pages...');
  
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
  
  // Create .nojekyll file to prevent GitHub Pages from ignoring files that begin with an underscore
  fs.writeFileSync(path.resolve(distDir, '.nojekyll'), '');
  
  // Create a CNAME file if needed for custom domain (commented out for now)
  // fs.writeFileSync(path.resolve(distDir, 'CNAME'), 'custom-domain.com');
  
  // Create an empty manifest.json file
  const manifestContent = JSON.stringify({
    "short_name": "HuskyMower",
    "name": "Husqvarna Automower Management Platform",
    "icons": [],
    "start_url": ".",
    "display": "standalone",
    "theme_color": "#000000",
    "background_color": "#ffffff"
  }, null, 2);
  fs.writeFileSync(path.resolve(distDir, 'manifest.json'), manifestContent);
  
  console.log('Static files copied successfully');
}

/**
 * Main function to run the GitHub Pages build
 */
async function main() {
  try {
    console.log('Starting GitHub Pages build process...');
    
    // Set production mode
    process.env.NODE_ENV = 'production';
    
    // Build the Vite frontend with the correct base path
    console.log('Building frontend with Vite...');
    // Set the base path for GitHub Pages (/{repo-name}/)
    execSync('npx vite build --base=/HuskyMower/', { stdio: 'inherit' });
    
    // Ensure the dist directory exists with expected structure
    console.log('Checking dist directory structure...');
    if (!fs.existsSync(path.dirname(distDir))) {
      console.log('Creating parent directory for dist/public');
      fs.mkdirSync(path.dirname(distDir), { recursive: true });
    }
    
    if (!fs.existsSync(distDir)) {
      console.log('Creating dist/public directory');
      fs.mkdirSync(distDir, { recursive: true });
    }
    
    // Make sure the dist/public directory exists
    if (!fs.existsSync(distDir)) {
      throw new Error('dist/public directory does not exist after build. Check the Vite build output for errors.');
    }
    
    // List files in dist directory to debug
    console.log('Contents of dist/public directory:');
    execSync('ls -la ./dist/public', { stdio: 'inherit' });
    
    // Update index.html with runtime base path detection
    updateIndexHtml();
    
    // Create runtime environment configuration
    createEnvConfig();
    
    // Copy static files
    copyStaticFiles();
    
    // Verify the final structure
    console.log('Final contents of dist/public directory:');
    execSync('ls -la ./dist/public', { stdio: 'inherit' });
    
    // Check for the index.html file
    if (fs.existsSync(path.join(distDir, 'index.html'))) {
      console.log('Checking index.html content:');
      execSync('cat ./dist/public/index.html | grep -n "base\\|script\\|link"', { stdio: 'inherit' });
    } else {
      console.error('WARNING: index.html not found in dist/public directory!');
    }
    
    // Ensure the files needed for GitHub Pages are present
    console.log('Checking for essential GitHub Pages files:');
    const essentialFiles = ['.nojekyll', '404.html', 'env-config.js'];
    essentialFiles.forEach(file => {
      if (fs.existsSync(path.join(distDir, file))) {
        console.log(`✅ ${file} exists`);
      } else {
        console.error(`❌ ${file} is missing!`);
      }
    });
    
    console.log('GitHub Pages build completed successfully!');
  } catch (error) {
    console.error('Error during GitHub Pages build:', error);
    process.exit(1);
  }
}

// Run the main function
main();