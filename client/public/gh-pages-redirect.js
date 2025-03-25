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

// Additional code for GitHub Pages base path handling
(function() {
  // Only run this in production and on GitHub Pages
  if (!window.location.hostname.includes('github.io')) {
    return;
  }
  
  console.log('GitHub Pages redirect script active');
  
  // Hardcoded repository name for GitHub Pages
  var repoName = 'HuskyMower';
  
  // Set up global ENV object for configuration
  window.ENV = window.ENV || {};
  window.ENV.BASE_PATH = '/' + repoName;
  
  // Function to fix asset URLs
  function fixAssetUrls() {
    // Fix script src attributes
    var scripts = document.querySelectorAll('script[src]');
    scripts.forEach(function(script) {
      if (script.src.startsWith(window.location.origin) && !script.src.includes('/' + repoName + '/')) {
        var newSrc = script.src.replace(window.location.origin, window.location.origin + '/' + repoName);
        console.log('Fixing script src:', script.src, '->', newSrc);
        script.src = newSrc;
      }
    });
    
    // Fix link href attributes
    var links = document.querySelectorAll('link[href]');
    links.forEach(function(link) {
      if (link.href.startsWith(window.location.origin) && !link.href.includes('/' + repoName + '/')) {
        var newHref = link.href.replace(window.location.origin, window.location.origin + '/' + repoName);
        console.log('Fixing link href:', link.href, '->', newHref);
        link.href = newHref;
      }
    });
    
    // Fix image src attributes
    var images = document.querySelectorAll('img[src]');
    images.forEach(function(img) {
      if (img.src.startsWith(window.location.origin) && !img.src.includes('/' + repoName + '/')) {
        var newSrc = img.src.replace(window.location.origin, window.location.origin + '/' + repoName);
        console.log('Fixing image src:', img.src, '->', newSrc);
        img.src = newSrc;
      }
    });
  }
  
  // Run when DOM is loaded
  document.addEventListener('DOMContentLoaded', fixAssetUrls);
  
  // Run now if document is already loaded
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    fixAssetUrls();
  }
})();