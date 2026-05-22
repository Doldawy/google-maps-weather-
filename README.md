# google-maps-weather-

A lightweight TypeScript + Vite app that overlays global weather effects on top of Google Maps.

## Highlights

- Works anywhere in the world by sampling the current Google Maps viewport.
- Refreshes weather only after the map becomes idle for 1.5 seconds.
- Reuses nearby weather results from a short in-memory cache to reduce API traffic.
- Uses lightweight CSS overlays for clear skies, clouds, rain intensity, fog, and day/night styling.
- Shows severe weather with 2D map markers for storms, hurricanes, and heavy-rain zones.
- Uses the free Open-Meteo current-weather API for low-cost global coverage.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a local `.env` file:
   ```bash
   cp .env.example .env
   ```
3. Add your Google Maps browser key:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_browser_key
   ```
4. Start the app:
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run typecheck` — run TypeScript without emitting files
- `npm run build` — create a production build

## Weather strategy

- A single batched weather request samples the visible map area.
- Refreshing is delayed until the user stops panning or zooming.
- Nearby results are cached for 5 minutes to avoid unnecessary repeat fetches.
- Weather rendering uses CSS and SVG markers only, so it stays lightweight across phones, tablets, and desktops.
