import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to update the index.html for GitHub Pages
function updateIndexHtml() {
  const indexPath = path.join('dist', 'index.html');
  
  if (fs.existsSync(indexPath)) {
    console.log('Updating index.html for GitHub Pages...');
    let content = fs.readFileSync(indexPath, 'utf8');
    
    // Update asset paths to use relative paths
    content = content.replace(/src="\//g, 'src="');
    content = content.replace(/href="\//g, 'href="');
    
    fs.writeFileSync(indexPath, content);
    console.log('index.html updated successfully');
  } else {
    console.error('index.html not found in dist folder');
  }
}

// Function to create a GitHub Pages specific env-config.js file to set
// environment variables at runtime without rebuilding
function createEnvConfig() {
  console.log('Creating runtime environment config for GitHub Pages...');
  
  const envConfigPath = path.join('dist', 'env-config.js');
  
  // These values will be replaced by actual environment variables in the GitHub Actions workflow
  const envConfig = `
window.ENV = {
  VITE_API_BASE_URL: "${process.env.VITE_API_BASE_URL || 'https://your-backend-server-url.com'}",
  VITE_FIREBASE_API_KEY: "${process.env.VITE_FIREBASE_API_KEY || ''}",
  VITE_FIREBASE_APP_ID: "${process.env.VITE_FIREBASE_APP_ID || ''}",
  VITE_FIREBASE_PROJECT_ID: "${process.env.VITE_FIREBASE_PROJECT_ID || ''}",
  VITE_AUTOMOWER_API_KEY: "${process.env.VITE_AUTOMOWER_API_KEY || ''}",
  VITE_AUTOMOWER_CLIENT_SECRET: "${process.env.VITE_AUTOMOWER_CLIENT_SECRET || ''}",
};
`;
  
  fs.writeFileSync(envConfigPath, envConfig);
  console.log('env-config.js created successfully');
  
  // Update index.html to load env-config.js
  const indexPath = path.join('dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    let content = fs.readFileSync(indexPath, 'utf8');
    const scriptTag = '<script src="env-config.js"></script>';
    
    // Add the script tag right before the closing head tag
    if (!content.includes(scriptTag)) {
      content = content.replace('</head>', `  ${scriptTag}\n  </head>`);
      fs.writeFileSync(indexPath, content);
      console.log('Added env-config.js script to index.html');
    }
  }
}

// Main function to configure the build for GitHub Pages
function configureForGitHubPages() {
  console.log('Configuring build for GitHub Pages deployment...');
  
  updateIndexHtml();
  createEnvConfig();
  
  console.log('GitHub Pages configuration complete');
}

// Run the configuration
configureForGitHubPages();