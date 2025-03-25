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
  
  const envVars = {
    VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY || '',
    VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID || '',
    VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID || '',
    AUTOMOWER_API_KEY: process.env.AUTOMOWER_API_KEY || '',
    AUTOMOWER_CLIENT_SECRET: process.env.AUTOMOWER_CLIENT_SECRET || ''
  };
  
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