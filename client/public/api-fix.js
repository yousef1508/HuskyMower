/**
 * API URL Override for GitHub Pages
 * 
 * This script FORCES the correct API URL for GitHub Pages deployments.
 * It runs before any other JavaScript code to ensure the API URL is correctly set.
 */
(function() {
  // Initialize ENV if it doesn't exist
  window.ENV = window.ENV || {};
  
  // First check if we're on GitHub Pages or the custom domain
  const isGitHubPages = window.location.hostname.includes('github.io') || 
                        window.location.hostname.includes('gjersjoengolfclub.com');
  
  if (isGitHubPages) {
    console.log('GitHub Pages/Custom domain detected - FORCING correct API URL');
    
    // CRITICAL FIX: The correct URL must be set here
    // This will override any other settings or configuration to ensure the correct API URL is used
    const CORRECT_API_URL = 'https://husky-mower.replit.app';
    
    // Force set the API URL in all possible configurations
    window.ENV.API_BASE_URL = CORRECT_API_URL;
    window.ENV.VITE_API_BASE_URL = CORRECT_API_URL;
    
    // Log that we've forced the change
    console.log('FORCED API URL override to:', CORRECT_API_URL);
    console.log('GitHub Pages debug info:', {
      hostname: window.location.hostname,
      origin: window.location.origin,
      apiUrl: CORRECT_API_URL
    });
    
    // Apply a global fetch override to catch and fix any incorrect URLs at runtime
    // This is a last-resort measure to fix any URLs that might still be incorrect
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      // If it's an API request to the incorrect domain, fix it
      if (typeof url === 'string' && 
          url.includes('husky-mower-backend.replit.app')) {
        
        const correctedUrl = url.replace(
          'husky-mower-backend.replit.app', 
          'husky-mower.replit.app'
        );
        
        console.warn('INTERCEPTED incorrect API URL. Redirecting:', url, '→', correctedUrl);
        url = correctedUrl;
      }
      
      // Add GitHub Pages specific headers to all API requests
      if (typeof url === 'string' && url.includes('husky-mower.replit.app')) {
        options = options || {};
        options.headers = options.headers || {};
        options.headers['Origin'] = window.location.origin;
        options.headers['X-GitHub-Deployment'] = 'true';
      }
      
      return originalFetch.call(this, url, options);
    };
    
    // Also add this information to document for debugging
    document.addEventListener('DOMContentLoaded', function() {
      const debugDiv = document.createElement('div');
      debugDiv.style.display = 'none';
      debugDiv.setAttribute('id', 'api-debug-info');
      debugDiv.setAttribute('data-api-url', CORRECT_API_URL);
      debugDiv.setAttribute('data-origin', window.location.origin);
      debugDiv.setAttribute('data-hostname', window.location.hostname);
      document.body.appendChild(debugDiv);
    });
  }
})();