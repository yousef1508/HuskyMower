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
  AUTOMOWER_CLIENT_SECRET: process.env.AUTOMOWER_CLIENT_SECRET || ''
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
  
  // Add script to detect the base path at runtime
  const runtimeScript = `
    <script>
      // GitHub Pages dynamic base path detection
      (function() {
        window.ENV = window.ENV || {};
        var pathSegments = window.location.pathname.split('/');
        var repoName = pathSegments[1];
        
        // Check if we're on GitHub Pages (username.github.io/repo-name)
        if (window.location.hostname.includes('github.io') && repoName !== '') {
          window.ENV.BASE_PATH = '/' + repoName;
          console.log('GitHub Pages detected, setting BASE_PATH to:', window.ENV.BASE_PATH);
          
          // Add base tag for relative URLs
          var baseTag = document.createElement('base');
          baseTag.href = window.ENV.BASE_PATH + '/';
          document.head.prepend(baseTag);
        } else {
          window.ENV.BASE_PATH = '';
        }
      })();
    </script>
  `;
  
  // Insert the script right after the opening head tag
  content = content.replace('<head>', '<head>' + runtimeScript);
  
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
window.ENV.VITE_FIREBASE_API_KEY = "${envVars.VITE_FIREBASE_API_KEY}";
window.ENV.VITE_FIREBASE_PROJECT_ID = "${envVars.VITE_FIREBASE_PROJECT_ID}";
window.ENV.VITE_FIREBASE_APP_ID = "${envVars.VITE_FIREBASE_APP_ID}";
window.ENV.AUTOMOWER_API_KEY = "${envVars.AUTOMOWER_API_KEY}";
window.ENV.AUTOMOWER_CLIENT_SECRET = "${envVars.AUTOMOWER_CLIENT_SECRET}";
console.log('Runtime environment configuration loaded');
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
 * Copy static files needed for GitHub Pages
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
    
    // Build the Vite frontend
    console.log('Building frontend with Vite...');
    execSync('npx vite build', { stdio: 'inherit' });
    
    // Make sure the dist directory exists
    if (!fs.existsSync(distDir)) {
      throw new Error('dist directory does not exist after build. Check the Vite build output for errors.');
    }
    
    // Update index.html with runtime base path detection
    updateIndexHtml();
    
    // Create runtime environment configuration
    createEnvConfig();
    
    // Copy static files
    copyStaticFiles();
    
    console.log('GitHub Pages build completed successfully!');
  } catch (error) {
    console.error('Error during GitHub Pages build:', error);
    process.exit(1);
  }
}

// Run the main function
main();