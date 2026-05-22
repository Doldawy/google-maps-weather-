# 🚗 Google Maps Realtime Weather Driver Mode

A cinematic, driver-style Google Maps experience with **real-time weather overlays** built in TypeScript, powered by the Google Maps JavaScript API and OpenWeatherMap.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Driver Mode style** | High-contrast, warm-amber map theme with 45° tilt for an immersive driving feel |
| **Live weather** | Fetches current conditions from OpenWeatherMap every 5 minutes |
| **Rain overlay** | Animated particle rain scaled to real precipitation intensity |
| **Sunlight glow** | Radial warm-tone lens-flare effect for clear sky conditions |
| **Fog / mist** | Drifting fog layers driven by real visibility data |
| **Cloud shadows** | Soft elliptical shadow patches proportional to cloud coverage |
| **UI toggle panel** | Toggle every effect on/off at runtime without a page reload |
| **Auto-pan refresh** | Weather updates automatically when you pan the map to a new area |
| **Cloudflare Pages** | Pre-configured `wrangler.toml`, `_headers`, `_redirects` for zero-config deployment |

---

## 🗂 Project Structure

```
google-maps-weather-/
├── src/
│   ├── config/         # API keys and app-wide settings
│   │   └── index.ts
│   ├── map/            # Google Maps initialisation and styling
│   │   ├── index.ts
│   │   └── styles.ts   # Driver-mode MapTypeStyle array
│   ├── weather/        # OpenWeatherMap integration
│   │   ├── index.ts    # WeatherService (polling + pub/sub)
│   │   ├── openweather.ts
│   │   └── types.ts
│   ├── effects/        # Canvas-based weather overlays
│   │   ├── index.ts    # EffectsManager (orchestrator)
│   │   ├── rain.ts
│   │   ├── sun.ts
│   │   ├── fog.ts
│   │   └── clouds.ts
│   └── main.ts         # Bootstrap and UI wiring
├── public/
│   ├── _headers        # Cloudflare Pages security headers
│   └── _redirects      # SPA fallback rewrite
├── index.html          # Shell HTML with control panel
├── vite.config.ts
├── tsconfig.json
├── wrangler.toml       # Cloudflare Pages build config
└── .env.example        # Environment variable template
```

---

## 🚀 Getting Started

### 1 — Prerequisites

- Node.js ≥ 18
- A [Google Maps JavaScript API key](https://developers.google.com/maps/documentation/javascript/get-api-key)
- An [OpenWeatherMap API key](https://openweathermap.org/api) (free tier works)

### 2 — Install dependencies

```bash
npm install
```

### 3 — Configure API keys

```bash
cp .env.example .env
```

Edit `.env`:

```dotenv
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_OPENWEATHER_API_KEY=your_openweather_key
```

> **Note:** When no API keys are configured the app falls back to mock weather data and the map will show a "For development purposes only" watermark from Google.

### 4 — Run the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### 5 — Build for production

```bash
npm run build
```

Output is written to `dist/`.

### 6 — Type-check only

```bash
npm run typecheck
```

---

## ☁️ Deploy to Cloudflare Pages

1. Push this repository to GitHub.
2. In the [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Pages** → **Create a project** → connect your repo.
3. Set **Build command**: `npm run build`  
   Set **Build output directory**: `dist`
4. Under **Environment variables**, add:
   - `VITE_GOOGLE_MAPS_API_KEY`
   - `VITE_OPENWEATHER_API_KEY`
5. Deploy.

Alternatively, use the Wrangler CLI:

```bash
npx wrangler pages deploy dist --project-name google-maps-weather-driver-mode
```

---

## 🎨 Visual Effects

### Rain
Canvas particles fall diagonally. Intensity is derived from the OpenWeatherMap condition group:
- `thunderstorm` → 100 %
- `rain` → 90 %
- `drizzle` → 45 %

### Sunlight Glow
A pulsing radial gradient centred in the upper-right of the viewport. Active when the sky is clear (cloudiness < 30 %).

### Fog
Multiple horizontally-drifting semi-transparent bands. Intensity is driven by the `visibility` field — below 3 km visibility equals 60 % fog intensity.

### Cloud Shadows
Soft elliptical gradients drift across the map. Intensity equals `cloudiness / 100` directly from the API.

---

## 🧩 Extending

| Goal | Where to look |
|---|---|
| Add a new effect | Create `src/effects/myEffect.ts`, register it in `EffectsManager` |
| Change the map style | Edit the `driverStyle` array in `src/map/styles.ts` |
| Switch weather provider | Implement `fetchWeather` in `src/weather/`, keep the `WeatherData` shape |
| Add a thunderstorm flash | Extend `EffectsManager.render()` and add a toggle to `index.html` |

---

## 📝 License

MIT

