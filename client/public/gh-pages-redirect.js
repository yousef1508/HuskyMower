// Single Page Apps for GitHub Pages
// MIT License
// https://github.com/rafgraph/spa-github-pages
// Modified for HuskyMower app specific needs

// This script checks to see if a redirect is present in the query string,
// converts it back into the correct URL and adds it to the
// browser's history using window.history.replaceState(...),
// which won't cause the browser to attempt to load the new URL.
// When the single page app is loaded further down in this file,
// the correct URL will be waiting in the browser's history for
// the single page app to route accordingly.
(function(l) {
  if (l.search[1] === '/' ) {
    var decoded = l.search.slice(1).split('&').map(function(s) { 
      return s.replace(/~and~/g, '&')
    }).join('?');
    window.history.replaceState(null, null,
        l.pathname.slice(0, -1) + decoded + l.hash
    );
  }
}(window.location));

// Enhanced GitHub Pages SPA support with redirect loop prevention
(function() {
  // Initialize runtime configuration
  window.ENV = window.ENV || {};
  
  // Detect GitHub Pages
  var isGitHubPages = window.location.hostname.includes('github.io');
  
  if (isGitHubPages) {
    console.log('GitHub Pages detected for HuskyMower app');
    
    // Hardcoded repository name for GitHub Pages
    var repoName = 'HuskyMower';
    window.ENV.BASE_PATH = '/' + repoName;
    console.log('Setting BASE_PATH to:', window.ENV.BASE_PATH);
    
    // Critical fix: Add base tag to the document head for proper relative URL resolution
    if (!document.querySelector('base')) {
      var base = document.createElement('base');
      base.href = window.ENV.BASE_PATH + '/';
      document.head.insertBefore(base, document.head.firstChild);
      console.log('Added base tag with href:', base.href);
    }
  }
  
  // Check for redirect path from sessionStorage - this is set by our 404.html page
  var redirectPath = sessionStorage.getItem('redirectPath');
  if (redirectPath) {
    console.log('Found redirect path in sessionStorage:', redirectPath);
    
    // Clear redirect data from sessionStorage
    sessionStorage.removeItem('redirectPath'); 
    sessionStorage.removeItem('redirectCount');
    
    // Check if we're already on the home route
    if (window.location.pathname === window.ENV.BASE_PATH + '/' || 
        window.location.pathname === window.ENV.BASE_PATH) {
      
      // We're at the root - use the history API to update URL without page reload
      var fullPath = (window.ENV.BASE_PATH || '') + 
                    (redirectPath.startsWith('/') ? redirectPath : '/' + redirectPath);
      
      console.log('At root path, updating URL to:', fullPath);
      
      // Dispatch the path change event for the router after a brief timeout
      setTimeout(function() {
        window.history.pushState(null, document.title, fullPath);
        
        // Dispatch an event that our app's router can listen for
        window.dispatchEvent(new CustomEvent('routeChange', { 
          detail: { path: redirectPath } 
        }));
      }, 100);
    }
  }
  
  // Function to fix asset URLs for GitHub Pages
  function fixAssetUrls() {
    // Only run on GitHub Pages
    if (!isGitHubPages) return;
    
    console.log('Fixing asset URLs for GitHub Pages');
    
    // Fix script src attributes
    var scripts = document.querySelectorAll('script[src]');
    scripts.forEach(function(script) {
      if (script.src.startsWith(window.location.origin) && 
          !script.src.includes('/' + repoName + '/')) {
        var originalSrc = script.getAttribute('src');
        
        // Only fix absolute paths
        if (originalSrc && originalSrc.startsWith('/') && !originalSrc.startsWith('/' + repoName)) {
          var newSrc = '/' + repoName + originalSrc;
          console.log('Fixing script src:', originalSrc, '->', newSrc);
          script.setAttribute('src', newSrc);
        }
      }
    });
    
    // Fix link href attributes
    var links = document.querySelectorAll('link[href]');
    links.forEach(function(link) {
      if (link.href.startsWith(window.location.origin) && 
          !link.href.includes('/' + repoName + '/')) {
        var originalHref = link.getAttribute('href');
        
        // Only fix absolute paths
        if (originalHref && originalHref.startsWith('/') && !originalHref.startsWith('/' + repoName)) {
          var newHref = '/' + repoName + originalHref;
          console.log('Fixing link href:', originalHref, '->', newHref);
          link.setAttribute('href', newHref);
        }
      }
    });
    
    // Fix image src attributes
    var images = document.querySelectorAll('img[src]');
    images.forEach(function(img) {
      if (img.src.startsWith(window.location.origin) && 
          !img.src.includes('/' + repoName + '/')) {
        var originalSrc = img.getAttribute('src');
        
        // Only fix absolute paths
        if (originalSrc && originalSrc.startsWith('/') && !originalSrc.startsWith('/' + repoName)) {
          var newSrc = '/' + repoName + originalSrc;
          console.log('Fixing image src:', originalSrc, '->', newSrc);
          img.setAttribute('src', newSrc);
        }
      }
    });
  }
  
  // Fix assets right away if DOM is ready
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    fixAssetUrls();
  } else {
    // Otherwise wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', fixAssetUrls);
  }
})();