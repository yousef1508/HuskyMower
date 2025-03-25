const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create the scripts directory if it doesn't exist
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Copy the CNAME file to the dist directory if it exists
if (fs.existsSync('CNAME')) {
  fs.copyFileSync('CNAME', path.join('dist', 'CNAME'));
}

// Create a simple JSON file to represent API responses for GitHub Pages demo
const createMockApiResponses = () => {
  const apiDir = path.join('dist', 'api');
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
  }

  // Create a sample status file
  fs.writeFileSync(
    path.join(apiDir, 'status.json'),
    JSON.stringify({ status: 'Static GitHub Pages Demo - API calls will be redirected to your backend server' })
  );
};

// Run the Vite build command
console.log('Building frontend...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  
  // Create necessary files for GitHub Pages
  console.log('Creating GitHub Pages-specific files...');
  
  // Copy the 404.html to the dist directory
  if (fs.existsSync('client/public/404.html')) {
    fs.copyFileSync('client/public/404.html', path.join('dist', '404.html'));
  }
  
  // Create a simple API status endpoint
  createMockApiResponses();
  
  console.log('Build complete for GitHub Pages deployment!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}