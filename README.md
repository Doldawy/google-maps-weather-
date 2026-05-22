# Google Maps Weather

A responsive TypeScript + React app that combines Google Maps with a global live weather layer. As the user pans the map, the app fetches weather for the new map center and updates animated sun, rain, clouds, and fog effects in real time.

## Features

- Global map experience powered by Google Maps
- Weather updates tied to the current map center anywhere in the world
- Dynamic visual layers for sun, rain, clouds, and fog
- Responsive layout for phones, tablets, laptops, and desktop screens
- Weather data powered by Open-Meteo

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Add your Google Maps JavaScript API key to `.env.local`:

   ```bash
   VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check project references and build for production
- `npm run typecheck` — run TypeScript checks without building
- `npm run lint` — run ESLint

## Notes

- The map requires a browser-enabled Google Maps JavaScript API key.
- Current weather conditions are fetched from the Open-Meteo forecast API.
- The weather layer updates when the map center moves enough to request fresh data for a new region.
