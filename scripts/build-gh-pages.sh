#!/bin/bash

# GitHub Pages build script
echo "Building for GitHub Pages deployment..."

# Set production mode
export NODE_ENV=production

# Build the Vite frontend
echo "Building frontend with Vite..."
npx vite build

# Run the post-build configuration script
echo "Running post-build configuration..."
node scripts/build-gh-pages.js

echo "GitHub Pages build complete!"
echo "The build output is in the 'dist' directory"