import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

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
        
        // For custom domain (gjersjoengolfclub.com), no base path is needed
        if (window.location.hostname.includes('gjersjoengolfclub.com')) {
          window.ENV.BASE_PATH = '';
          console.log('Custom domain detected, no BASE_PATH needed');
          return;
        }
        
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
        
        // Add debug info to console to help troubleshoot URL issues
        console.log('Runtime environment: ', {
          hostname: window.location.hostname,
          pathname: window.location.pathname,
          origin: window.location.origin,
          basePath: window.ENV.BASE_PATH
        });
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
  
  // IMPORTANT: The backend API URL must match your actual Replit URL
  // The error in the logs shows it's trying to access husky-mower-backend.replit.app
  // But based on your setup, it should be husky-mower.replit.app
  
  const envVars = {
    VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY || '',
    VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID || '',
    VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID || '',
    AUTOMOWER_API_KEY: process.env.AUTOMOWER_API_KEY || '',
    AUTOMOWER_CLIENT_SECRET: process.env.AUTOMOWER_CLIENT_SECRET || '',
    // Corrected API URL - this is the correct domain for the backend
    VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || 'https://husky-mower.replit.app',
    
    // Add flags to indicate when secrets are available but not expose values
    FIREBASE_API_KEY_SET: !!process.env.VITE_FIREBASE_API_KEY,
    FIREBASE_APP_ID_SET: !!process.env.VITE_FIREBASE_APP_ID
  };
  
  const envConfigContent = `
// Runtime environment configuration
window.ENV = window.ENV || {};

// Firebase configuration
window.ENV.FIREBASE_API_KEY = "${envVars.VITE_FIREBASE_API_KEY}";
window.ENV.FIREBASE_PROJECT_ID = "${envVars.VITE_FIREBASE_PROJECT_ID}";
window.ENV.FIREBASE_APP_ID = "${envVars.VITE_FIREBASE_APP_ID}";

// API configuration - correct backend domain for Replit deployment
window.ENV.API_BASE_URL = "${envVars.VITE_API_BASE_URL}";

// Also provide variables with VITE_ prefix for compatibility
window.ENV.VITE_FIREBASE_API_KEY = "${envVars.VITE_FIREBASE_API_KEY}";
window.ENV.VITE_FIREBASE_PROJECT_ID = "${envVars.VITE_FIREBASE_PROJECT_ID}";
window.ENV.VITE_FIREBASE_APP_ID = "${envVars.VITE_FIREBASE_APP_ID}";
window.ENV.VITE_API_BASE_URL = "${envVars.VITE_API_BASE_URL}";

// Only pass boolean flags for sensitive values in logs
window.ENV.FIREBASE_API_KEY_SET = ${envVars.FIREBASE_API_KEY_SET};
window.ENV.FIREBASE_APP_ID_SET = ${envVars.FIREBASE_APP_ID_SET};

// Add build timestamp and version info for debugging
window.ENV.BUILD_TIMESTAMP = "${new Date().toISOString()}";
window.ENV.APP_VERSION = "1.0.4";
window.ENV.IS_GITHUB_PAGES = true;
window.ENV.DEPLOYMENT_TARGET = "github-pages";

// Check if we need to override the API URL based on the hostname
(function() {
  // For custom domain deployment
  if (window.location.hostname.includes('gjersjoengolfclub.com')) {
    console.log('Custom domain detected on gjersjoengolfclub.com, using default API URL');
  } 
  // For GitHub Pages deployment
  else if (window.location.hostname.includes('github.io')) {
    console.log('GitHub Pages deployment detected, using API URL:', window.ENV.API_BASE_URL);
  }
  // For local development
  else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('Local development detected, using relative API URLs');
    // In dev mode, we use relative URLs so don't override API_BASE_URL
  }
})();

console.log('Runtime environment configuration loaded: ', { 
  FIREBASE_PROJECT_ID: window.ENV.FIREBASE_PROJECT_ID,
  API_BASE_URL: window.ENV.API_BASE_URL,
  FIREBASE_API_KEY_SET: window.ENV.FIREBASE_API_KEY_SET,
  FIREBASE_APP_ID_SET: window.ENV.FIREBASE_APP_ID_SET,
  APP_VERSION: window.ENV.APP_VERSION,
  DEPLOYMENT_TARGET: window.ENV.DEPLOYMENT_TARGET,
  BUILD_TIMESTAMP: window.ENV.BUILD_TIMESTAMP
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
 * Configure the build output for GitHub Pages deployment
 */
export async function configureForGitHubPages() {
  console.log('Configuring build for GitHub Pages...');
  
  // Update index.html with runtime base path detection
  updateIndexHtml();
  
  // Create runtime environment configuration
  createEnvConfig();
  
  console.log('GitHub Pages configuration completed');
  return true;
}

export default configureForGitHubPages;