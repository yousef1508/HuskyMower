# Husqvarna Automower Management Platform

A comprehensive TypeScript-powered robotic lawnmower management platform that provides intelligent, user-friendly control and monitoring for smart lawn care.

## Features

- Full-stack TypeScript application
- Real-time mower tracking and status monitoring
- Weather-integrated lawn management
- Secure authentication system
- RESTful API for mower control and data retrieval
- Geofencing and zone management

## Deployment to GitHub Pages

This application is set up for deployment to GitHub Pages for the frontend with a separate backend server deployment.

### Prerequisites

1. Create a GitHub repository named `testhusqvarna-api`
2. Set up the following secrets in your GitHub repository settings:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_PROJECT_ID`
   - `AUTOMOWER_API_KEY`
   - `AUTOMOWER_CLIENT_SECRET`

### Deployment Steps

1. Push your code to the GitHub repository
2. GitHub Actions will automatically build and deploy the frontend to GitHub Pages
3. The backend needs to be deployed separately (e.g., to Heroku, Render, etc.)
4. After deploying the backend, update the `VITE_API_BASE_URL` in `.github/workflows/deploy.yml` to point to your backend server URL

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

## License

[MIT License](LICENSE)