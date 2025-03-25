# Husqvarna Automower Management Platform

A comprehensive TypeScript-powered robotic lawnmower management platform that provides intelligent, user-friendly control and monitoring for smart lawn care.

## Features

- Full-stack TypeScript application
- Real-time mower tracking and status monitoring
- Weather-integrated lawn management
- Secure authentication system
- RESTful API for mower control and data retrieval
- Geofencing and zone management

## Firebase Authentication Setup

This application uses Firebase for authentication:

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project
2. Add a web app to your Firebase project by clicking the "</>" icon
3. Enable Email/Password authentication in the Firebase Console:
   - Go to Authentication > Sign-in method
   - Enable Email/Password provider
   - Save your changes
4. Note your Firebase configuration values:
   - API Key (`VITE_FIREBASE_API_KEY`)
   - App ID (`VITE_FIREBASE_APP_ID`)
   - Project ID (`VITE_FIREBASE_PROJECT_ID`)
5. Once deployed, add your domain to the authorized domains list in Firebase Console:
   - Go to Authentication > Settings > Authorized domains
   - Add your GitHub Pages domain (e.g., `yourusername.github.io`)

## Husqvarna Automower API Setup

This application integrates with the Husqvarna Automower API:

1. Visit the [Husqvarna Developer Portal](https://developer.husqvarnagroup.cloud/)
2. Create a new application and get your API credentials:
   - API Key (`AUTOMOWER_API_KEY`)
   - Client Secret (`AUTOMOWER_CLIENT_SECRET`)

## Deployment to GitHub Pages

This application is set up for deployment to GitHub Pages for the frontend with a separate backend server deployment.

### Prerequisites

1. Use the existing GitHub repository https://github.com/yousef1508/HuskyMower
2. Set up the following secrets in your GitHub repository settings:
   - `VITE_FIREBASE_API_KEY` - From Firebase Console
   - `VITE_FIREBASE_APP_ID` - From Firebase Console
   - `VITE_FIREBASE_PROJECT_ID` - From Firebase Console
   - `AUTOMOWER_API_KEY` - From Husqvarna Developer Portal
   - `AUTOMOWER_CLIENT_SECRET` - From Husqvarna Developer Portal
   - `VITE_API_BASE_URL` - Your backend server URL (once deployed)

### Enable GitHub Pages

**Important:** Before the GitHub Actions workflow can deploy to GitHub Pages, you must enable GitHub Pages in your repository settings:

1. Go to your GitHub repository
2. Click on "Settings" tab
3. Scroll down to the "Pages" section in the sidebar
4. Under "Build and deployment", select "GitHub Actions" as the source
5. Save your changes

Without completing this step, the GitHub Actions workflow will fail with an error about Pages not being enabled.

### Deployment Steps

1. Push your code to the GitHub repository
2. GitHub Actions will automatically build and deploy the frontend to GitHub Pages
3. The backend needs to be deployed separately (e.g., to Replit, Heroku, Render, etc.)
4. After deploying the backend, update the `VITE_API_BASE_URL` secret in GitHub repository settings with your backend server URL
5. For the sample deployment, we use: `https://husky-mower-backend.replit.app`

### Manual Deployment

If you need to deploy manually:

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables in `.env` or `.env.production`
4. Build for GitHub Pages: `node scripts/build-gh-pages.js`
5. Deploy the `dist` directory to your preferred hosting service

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env`
4. Start the development server: `npm run dev`

## Backend Setup

The backend requires a PostgreSQL database. Configure the database connection in the `.env` file with your credentials:

```
DATABASE_URL=postgresql://username:password@localhost:5432/dbname
```

### Deploying the Backend to Replit

To deploy the backend to Replit for use with the GitHub Pages frontend:

1. Create a new Repl and import the repository
2. In the Replit environment, set up the following secrets:
   - `AUTOMOWER_API_KEY` - From Husqvarna Developer Portal
   - `AUTOMOWER_CLIENT_SECRET` - From Husqvarna Developer Portal
   - Other environment variables as needed (Firebase, etc.)
3. Create a PostgreSQL database in Replit (will automatically set up the required database environment variables)
4. Configure the server to run on port 443 for HTTPS support
5. Deploy the Repl and note the URL (e.g., `https://husky-mower-backend.replit.app`)
6. Update the `VITE_API_BASE_URL` secret in your GitHub repository with this URL
7. Configure CORS in the backend to allow requests from your GitHub Pages domain

Once deployed, ensure the backend API is working by testing an endpoint like `/api/mowers` in your browser or with a tool like Postman.

## License

[MIT License](LICENSE)