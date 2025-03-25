// Single-page application redirect for GitHub Pages
// This script is added to handle GitHub Pages routing
(function() {
  // Detect if this is GitHub Pages deployment
  // For GitHub Pages, we need to handle the repository name in the URL
  if (window.location.hostname.indexOf('github.io') > -1) {
    // The repository name will be after the username in the path
    // Example: https://username.github.io/repo-name/
    const pathSegments = window.location.pathname.split('/');
    const repoName = pathSegments[1]; // First segment after the leading slash
    
    // If we have at least 3 segments (including initial empty one from leading slash)
    // AND we're not at root with just the repo name
    if (pathSegments.length >= 3 && pathSegments[2] !== '') {
      // Check if this is a direct load (not from router)
      // Look for other segments and setup SPA correctly
      const path = window.location.pathname.substring(
        window.location.pathname.indexOf(repoName) + repoName.length + 1
      );
      
      // If this doesn't look like an asset URL (no file extension)
      if (!path.includes('.')) {
        console.log(`GitHub Pages SPA redirect: setting window.ENV.BASE_PATH to /${repoName}`);
        // Make sure we have window.ENV object
        window.ENV = window.ENV || {};
        window.ENV.BASE_PATH = `/${repoName}`;
      }
    }
  }
})();