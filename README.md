# Google Maps – Realtime Weather Driver Mode

A cinematic TypeScript web application that transforms Google Maps into a **Driver-style navigation experience** with live weather visual effects. Animated overlays for rain, sunlight, fog, clouds, and shadows dynamically respond to real-time OpenWeatherMap data, while a custom dark warm-tone map style keeps the experience immersive and high-contrast.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Driver-style map** | Custom dark/warm Google Maps style with amber roads, subtle perspective tilt, and high contrast |
| **Real-time weather** | Fetches live conditions from OpenWeatherMap every 5 minutes |
| **Animated overlays** | Falling rain drops, radial sun glow, drifting fog wisps, cloud puffs, directional shadows |
| **Toggle panel** | UI panel to enable/disable each effect independently |
| **Geolocation** | Automatically centres on the user's current location |
| **Cloudflare Pages ready** | `wrangler.toml` configured; `npm run build` outputs to `dist/` |

---

## 📁 Project Structure

```
google-maps-weather-/
├── index.html                 # HTML entry point & UI panel markup
├── vite.config.ts             # Vite build configuration
├── tsconfig.json              # TypeScript configuration
├── wrangler.toml              # Cloudflare Pages build settings
├── .env.example               # Template for API keys
└── src/
    ├── main.ts                # App entry point – wires everything together
    ├── config/
    │   ├── env.ts             # API keys & environment settings
    │   └── mapStyles.ts       # Driver-mode Google Maps style array
    ├── map/
    │   └── MapController.ts   # Maps API loader, init, camera helpers
    ├── weather/
    │   ├── types.ts           # WeatherData & WeatherCondition types
    │   └── WeatherService.ts  # OpenWeatherMap fetch + caching
    ├── effects/
    │   ├── EffectsEngine.ts   # RAF loop, renderer registry, weather→effects mapping
    │   ├── RainEffect.ts      # Animated falling raindrops
    │   ├── SunEffect.ts       # Radial sunlight glow + bokeh flares
    │   ├── FogEffect.ts       # Drifting fog wisps
    │   ├── CloudEffect.ts     # Slowly moving cloud puffs
    │   └── ShadowEffect.ts    # Directional edge shadows
    └── ui/
        └── UIPanel.ts         # Toggle bindings & weather display updates
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- A **Google Maps JavaScript API** key with Maps JS enabled  
  → [Get a key](https://developers.google.com/maps/documentation/javascript/get-api-key)
- A **OpenWeatherMap** API key (free tier is sufficient)  
  → [Sign up](https://openweathermap.org/appid)

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set up API keys
cp .env.example .env.local
#    → Edit .env.local and replace the placeholder values

# 3. Start the dev server
npm run dev
#    Opens http://localhost:5173
```

### Production Build

```bash
npm run build
# Output is in dist/
```

### Type-check Only

```bash
npm run typecheck
```

---

## ☁️ Deploying to Cloudflare Pages

1. Push this repository to GitHub (or GitLab).
2. In the [Cloudflare Dashboard](https://dash.cloudflare.com/), create a new **Pages** project and connect your repo.
3. Set **Build command** to `npm run build` and **Build output directory** to `dist`.
4. Add your API keys as **Environment Variables** in the Pages project settings:

   | Variable | Value |
   |---|---|
   | `VITE_GOOGLE_MAPS_API_KEY` | Your Google Maps API key |
   | `VITE_OPENWEATHER_API_KEY` | Your OpenWeatherMap API key |

5. Deploy – Cloudflare Pages will automatically rebuild on every push.

---

## 🎨 Visual Effects

| Effect | Triggered by | Canvas technique |
|---|---|---|
| **Rain** 🌧 | `rain`, `drizzle`, `thunderstorm` | Animated diagonal line strokes |
| **Sunlight** ☀️ | `clear` | Radial gradient glow + pulsing bokeh circles |
| **Fog** 🌫 | `fog`, `mist`, `haze`, `snow` | Drifting elliptical radial gradients |
| **Clouds** ☁️ | `clouds`, `rain`, `thunderstorm`, `fog` | Scrolling multi-puff radial gradients |
| **Shadows** 🌑 | `clear` (full sun), heavy clouds | Animated edge vignettes |

All effects are rendered on a transparent `<canvas>` overlay that sits on top of the Google Maps `<div>` and below the UI panel. They run in a `requestAnimationFrame` loop and automatically resize on window resize.

---

## ⚙️ Configuration

Edit `src/config/env.ts` to change defaults:

```ts
export const config = {
  defaultCenter: { lat: 25.2048, lng: 55.2708 }, // Starting city
  defaultZoom: 15,
  weatherRefreshIntervalMs: 5 * 60 * 1000,        // 5 minutes
};
```

---

## 🔑 API Keys & Security

- **Never** commit real API keys to source control.
- Use `.env.local` for local development (it is listed in `.gitignore`).
- Use Cloudflare Pages **Environment Variables** for production.
- Restrict your Google Maps API key to your domain in the Google Cloud Console.

---

## 🛠 Tech Stack

| Tool | Purpose |
|---|---|
| TypeScript | Type-safe application code |
| Vite | Dev server & production bundler |
| Google Maps JS API | Map rendering & geolocation |
| OpenWeatherMap API | Real-time weather data |
| Canvas 2D API | Weather visual overlays |
| Cloudflare Pages | Static hosting & CDN |

---

## 📄 License

MIT – see [LICENSE](LICENSE) for details.

