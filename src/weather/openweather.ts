/**
 * /src/weather/openweather.ts
 *
 * Fetches real-time weather data from OpenWeatherMap and derives nearby
 * extreme weather systems for the visible map region.
 */

import type {
  RotationDirection,
  WeatherCondition,
  WeatherData,
  WeatherEvent,
} from './types';

const CURRENT_URL = 'https://api.openweathermap.org/data/2.5/weather';
const NEARBY_URL = 'https://api.openweathermap.org/data/2.5/find';
const PLACEHOLDER_API_KEY = 'YOUR_OPENWEATHER_API_KEY_HERE';

interface OWMWeatherEntry {
  id: number;
  description: string;
}

interface OWMCommonResponse {
  coord: { lat: number; lon: number };
  weather: OWMWeatherEntry[];
  main: {
    temp: number;
    humidity: number;
    pressure: number;
    feels_like?: number;
  };
  wind: {
    speed: number;
    deg?: number;
    gust?: number;
  };
  clouds: { all: number };
  visibility?: number;
  rain?: { '1h'?: number; '3h'?: number };
  snow?: { '1h'?: number; '3h'?: number };
  dt: number;
  timezone?: number;
  sys?: {
    sunrise?: number;
    sunset?: number;
  };
  name?: string;
}

interface OWMCurrentResponse extends OWMCommonResponse {}

interface OWMNearbyStation extends OWMCommonResponse {
  id: number;
  name: string;
}

interface OWMNearbyResponse {
  list: OWMNearbyStation[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Map OpenWeatherMap group IDs to our internal condition tokens. */
function mapConditionId(id: number): WeatherCondition {
  if (id >= 200 && id < 300) return 'thunderstorm';
  if (id >= 300 && id < 400) return 'drizzle';
  if (id >= 500 && id < 600) return 'rain';
  if (id >= 600 && id < 700) return 'snow';
  if (id === 701) return 'mist';
  if (id === 721 || id === 731 || id === 751 || id === 761 || id === 762)
    return 'haze';
  if (id === 741) return 'fog';
  if (id === 781) return 'thunderstorm';
  if (id === 800) return 'clear';
  if (id > 800) return 'clouds';
  return 'unknown';
}

/** Return an emoji that represents the weather condition. */
function conditionIcon(condition: WeatherCondition): string {
  const map: Record<WeatherCondition, string> = {
    clear: '☀️',
    clouds: '☁️',
    rain: '🌧️',
    drizzle: '🌦️',
    thunderstorm: '⛈️',
    snow: '❄️',
    fog: '🌫️',
    mist: '🌁',
    haze: '🌫️',
    unknown: '🌡️',
  };
  return map[condition];
}

function getPrecipitationMm(
  rain?: { '1h'?: number; '3h'?: number },
  snow?: { '1h'?: number; '3h'?: number },
): number {
  const rainMm = rain?.['1h'] ?? (rain?.['3h'] ?? 0) / 3;
  const snowMm = snow?.['1h'] ?? (snow?.['3h'] ?? 0) / 3;
  return Math.round((rainMm + snowMm) * 10) / 10;
}

function getRotationDirection(lat: number): RotationDirection {
  return lat >= 0 ? 'counterclockwise' : 'clockwise';
}

function stormStrengthLabel(type: WeatherEvent['type'], windKmh: number): string {
  if (type === 'hurricane') {
    if (windKmh >= 252) return 'Cat 5';
    if (windKmh >= 209) return 'Cat 4';
    if (windKmh >= 178) return 'Cat 3';
    if (windKmh >= 154) return 'Cat 2';
    return 'Cat 1';
  }

  if (type === 'cyclone') return windKmh >= 110 ? 'Severe' : 'Strong';
  if (type === 'tropical-storm') return windKmh >= 90 ? 'Intense' : 'Active';
  if (type === 'heavy-rain-cell') return windKmh >= 70 ? 'Violent' : 'Heavy';
  return windKmh >= 80 ? 'Jet' : 'Strong';
}

function describeEvent(type: WeatherEvent['type'], station: OWMNearbyStation): string {
  const weatherEntry = station.weather[0];
  const windKmh = Math.round(station.wind.speed * 3.6);
  const condition = weatherEntry ? mapConditionId(weatherEntry.id) : 'unknown';

  switch (type) {
    case 'hurricane':
      return `${stormStrengthLabel(type, windKmh)} hurricane signature over ${station.name}`;
    case 'cyclone':
      return `${stormStrengthLabel(type, windKmh)} cyclonic circulation near ${station.name}`;
    case 'tropical-storm':
      return `${stormStrengthLabel(type, windKmh)} tropical storm near ${station.name}`;
    case 'heavy-rain-cell':
      return `Heavy rain cell with ${condition} conditions near ${station.name}`;
    case 'wind-pattern':
      return `Fast-moving wind band near ${station.name}`;
  }
}

function detectExtremeEvents(stations: OWMNearbyStation[]): WeatherEvent[] {
  const events: WeatherEvent[] = [];

  for (const station of stations) {
    const weatherEntry = station.weather[0];
    if (!weatherEntry) continue;

    const windKmh = Math.round(station.wind.speed * 3.6 * 10) / 10;
    const gustKmh = Math.round((station.wind.gust ?? station.wind.speed) * 3.6 * 10) / 10;
    const pressureHpa = station.main.pressure;
    const precipitationMm = getPrecipitationMm(station.rain, station.snow);
    const condition = mapConditionId(weatherEntry.id);

    let type: WeatherEvent['type'] | null = null;
    let strength = 0;

    if (windKmh >= 118 || gustKmh >= 140 || pressureHpa <= 975) {
      type = 'hurricane';
      strength = clamp((Math.max(windKmh, gustKmh) - 118) / 134, 0.7, 1);
    } else if (windKmh >= 92 || pressureHpa <= 990) {
      type = 'cyclone';
      strength = clamp((Math.max(windKmh, gustKmh) - 92) / 70, 0.55, 0.9);
    } else if (windKmh >= 63 || gustKmh >= 75) {
      type = 'tropical-storm';
      strength = clamp((Math.max(windKmh, gustKmh) - 63) / 55, 0.4, 0.8);
    } else if (
      precipitationMm >= 8 ||
      (condition === 'thunderstorm' && precipitationMm >= 2) ||
      (condition === 'rain' && station.clouds.all >= 90 && windKmh >= 40)
    ) {
      type = 'heavy-rain-cell';
      strength = clamp(precipitationMm / 18 + windKmh / 180, 0.35, 0.85);
    } else if (windKmh >= 45) {
      type = 'wind-pattern';
      strength = clamp(windKmh / 120, 0.3, 0.7);
    }

    if (!type) continue;

    events.push({
      id: `${station.id}-${type}`,
      type,
      position: {
        lat: station.coord.lat,
        lng: station.coord.lon,
      },
      strength,
      strengthLabel: stormStrengthLabel(type, Math.max(windKmh, gustKmh)),
      rotationDirection: getRotationDirection(station.coord.lat),
      sizeKm: Math.round(clamp(120 + Math.max(windKmh, gustKmh) * 3 + station.clouds.all * 4, 120, 900)),
      windKmh: Math.max(windKmh, gustKmh),
      pressureHpa,
      description: describeEvent(type, station),
    });
  }

  return events
    .sort((a, b) => b.strength - a.strength)
    .filter(
      (event, index, all) =>
        all.findIndex(
          (candidate) =>
            candidate.type === event.type &&
            Math.abs(candidate.position.lat - event.position.lat) < 0.2 &&
            Math.abs(candidate.position.lng - event.position.lng) < 0.2,
        ) === index,
    )
    .slice(0, 8);
}

function createMockWeather(lat: number, lon: number): WeatherData {
  const now = Date.now();
  const timezoneOffsetSec = Math.round(lon / 15) * 3600;
  const localTimeMs = now + timezoneOffsetSec * 1000;
  const localDate = new Date(localTimeMs);
  const localHour = localDate.getUTCHours() + localDate.getUTCMinutes() / 60;
  const dayProgress = clamp((localHour - 6) / 12, 0, 1);
  const isDay = localHour >= 6 && localHour <= 18;
  const sunriseMs = Date.UTC(
    localDate.getUTCFullYear(),
    localDate.getUTCMonth(),
    localDate.getUTCDate(),
    6,
    0,
    0,
  );
  const sunsetMs = Date.UTC(
    localDate.getUTCFullYear(),
    localDate.getUTCMonth(),
    localDate.getUTCDate(),
    18,
    0,
    0,
  );

  const tropicalBand = 1 - clamp(Math.abs(lat) / 35, 0, 1);
  const windSignal = (Math.sin((lon + lat) / 12) + 1) / 2;
  const stormSignal =
    ((Math.sin(lat / 7 + now / 3.6e6) + 1) / 2) * 0.6 + tropicalBand * 0.4;
  const cloudiness = Math.round(clamp((stormSignal + windSignal) * 55, 5, 100));
  const windKmh = Math.round(clamp(18 + windSignal * 80 + tropicalBand * 30, 6, 160));
  const gustKmh = Math.round(windKmh * (1.12 + tropicalBand * 0.35));
  const precipitationMm = Number(
    clamp((stormSignal - 0.48) * 20 + tropicalBand * 4, 0, 24).toFixed(1),
  );
  const visibilityM = Math.round(clamp(12000 - precipitationMm * 650 - cloudiness * 40, 1000, 12000));
  const tempC = Math.round((28 - Math.abs(lat) * 0.45 + dayProgress * 6 - precipitationMm * 0.4) * 10) / 10;
  const pressureHpa = Math.round(clamp(1015 - stormSignal * 42 - tropicalBand * 12, 948, 1028));

  let condition: WeatherCondition = 'clear';
  if (precipitationMm >= 10 || windKmh >= 90) condition = 'thunderstorm';
  else if (precipitationMm >= 4) condition = 'rain';
  else if (cloudiness >= 75) condition = 'clouds';
  else if (visibilityM <= 3500) condition = 'fog';
  else if (cloudiness >= 45) condition = 'clouds';

  const extremeEvents: WeatherEvent[] = [];
  if (tropicalBand > 0.45 && windKmh >= 118) {
    extremeEvents.push({
      id: `mock-hurricane-${Math.round(lat * 10)}-${Math.round(lon * 10)}`,
      type: 'hurricane',
      position: { lat: lat + 1.8, lng: lon - 2.4 },
      strength: clamp(windKmh / 170, 0.72, 0.96),
      strengthLabel: stormStrengthLabel('hurricane', windKmh),
      rotationDirection: getRotationDirection(lat),
      sizeKm: Math.round(clamp(240 + tropicalBand * 300 + precipitationMm * 8, 220, 760)),
      windKmh,
      pressureHpa,
      description: 'Mock hurricane tracker (configure a real OpenWeather API key for live storms)',
    });
  } else if (tropicalBand > 0.3 && windKmh >= 72) {
    extremeEvents.push({
      id: `mock-storm-${Math.round(lat * 10)}-${Math.round(lon * 10)}`,
      type: 'tropical-storm',
      position: { lat: lat + 1.1, lng: lon - 1.6 },
      strength: clamp(windKmh / 120, 0.45, 0.78),
      strengthLabel: stormStrengthLabel('tropical-storm', windKmh),
      rotationDirection: getRotationDirection(lat),
      sizeKm: Math.round(clamp(180 + tropicalBand * 200, 160, 520)),
      windKmh,
      pressureHpa,
      description: 'Mock tropical storm tracker (configure a real OpenWeather API key for live storms)',
    });
  }

  if (precipitationMm >= 7) {
    extremeEvents.push({
      id: `mock-rain-${Math.round(lat * 10)}-${Math.round(lon * 10)}`,
      type: 'heavy-rain-cell',
      position: { lat: lat - 0.7, lng: lon + 0.9 },
      strength: clamp(precipitationMm / 20, 0.35, 0.82),
      strengthLabel: stormStrengthLabel('heavy-rain-cell', windKmh),
      rotationDirection: getRotationDirection(lat),
      sizeKm: Math.round(clamp(110 + precipitationMm * 14, 120, 360)),
      windKmh,
      pressureHpa,
      description: 'Mock heavy rain cell (configure a real OpenWeather API key for live cells)',
    });
  }

  if (windKmh >= 45) {
    extremeEvents.push({
      id: `mock-wind-${Math.round(lat * 10)}-${Math.round(lon * 10)}`,
      type: 'wind-pattern',
      position: { lat: lat + 0.4, lng: lon + 1.2 },
      strength: clamp(windKmh / 110, 0.3, 0.76),
      strengthLabel: stormStrengthLabel('wind-pattern', windKmh),
      rotationDirection: getRotationDirection(lat),
      sizeKm: Math.round(clamp(140 + windKmh * 3, 140, 500)),
      windKmh,
      pressureHpa,
      description: 'Mock high-wind pattern (configure a real OpenWeather API key for live winds)',
    });
  }

  return {
    condition,
    tempC,
    humidity: Math.round(clamp(48 + stormSignal * 42, 30, 100)),
    windKmh,
    windDeg: Math.round(((lon % 360) + 360) % 360),
    gustKmh,
    pressureHpa,
    precipitationMm,
    description: isDay ? 'Global mock weather' : 'Global mock night weather',
    icon: conditionIcon(condition),
    cloudiness,
    visibilityM,
    localTimeMs,
    sunriseMs,
    sunsetMs,
    isDay,
    coord: { lat, lng: lon },
    locationName: `Lat ${lat.toFixed(2)}, Lng ${lon.toFixed(2)}`,
    extremeEvents,
  };
}

function normaliseWeather(
  current: OWMCurrentResponse,
  nearbyStations: OWMNearbyStation[],
): WeatherData {
  const weatherEntry = current.weather[0];
  const condition = weatherEntry ? mapConditionId(weatherEntry.id) : 'unknown';
  const timezoneOffsetSec = current.timezone ?? 0;
  const sunriseMs = ((current.sys?.sunrise ?? current.dt - 6 * 3600) + timezoneOffsetSec) * 1000;
  const sunsetMs = ((current.sys?.sunset ?? current.dt + 6 * 3600) + timezoneOffsetSec) * 1000;
  const localTimeMs = (current.dt + timezoneOffsetSec) * 1000;

  return {
    condition,
    tempC: Math.round(current.main.temp * 10) / 10,
    humidity: current.main.humidity,
    windKmh: Math.round(current.wind.speed * 3.6 * 10) / 10,
    windDeg: current.wind.deg ?? 0,
    gustKmh: Math.round(((current.wind.gust ?? current.wind.speed) * 3.6) * 10) / 10,
    pressureHpa: current.main.pressure,
    precipitationMm: getPrecipitationMm(current.rain, current.snow),
    description: weatherEntry
      ? weatherEntry.description.charAt(0).toUpperCase() + weatherEntry.description.slice(1)
      : 'Unknown conditions',
    icon: conditionIcon(condition),
    cloudiness: current.clouds.all,
    visibilityM: current.visibility ?? 10000,
    localTimeMs,
    sunriseMs,
    sunsetMs,
    isDay: localTimeMs >= sunriseMs && localTimeMs <= sunsetMs,
    coord: {
      lat: current.coord.lat,
      lng: current.coord.lon,
    },
    locationName:
      current.name && current.name.trim().length > 0
        ? current.name
        : `${current.coord.lat.toFixed(2)}, ${current.coord.lon.toFixed(2)}`,
    extremeEvents: detectExtremeEvents([
      {
        id: 0,
        name: current.name ?? 'Current location',
        ...current,
      },
      ...nearbyStations,
    ]),
  };
}

/**
 * Fetch current weather and nearby severe systems for the given coordinates.
 */
export async function fetchWeather(
  lat: number,
  lon: number,
  apiKey: string,
): Promise<WeatherData | null> {
  if (apiKey === PLACEHOLDER_API_KEY) {
    console.warn('[weather] OpenWeather API key not configured — using global mock weather.');
    return createMockWeather(lat, lon);
  }

  try {
    const currentUrl = `${CURRENT_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${encodeURIComponent(apiKey)}`;
    const nearbyUrl = `${NEARBY_URL}?lat=${lat}&lon=${lon}&cnt=30&units=metric&appid=${encodeURIComponent(apiKey)}`;

    const [currentResponse, nearbyResponse] = await Promise.all([
      fetch(currentUrl),
      fetch(nearbyUrl).catch(() => null),
    ]);

    if (!currentResponse.ok) {
      console.error(`[weather] API error ${currentResponse.status}: ${currentResponse.statusText}`);
      return null;
    }

    const currentData = (await currentResponse.json()) as OWMCurrentResponse;
    const nearbyData = nearbyResponse && nearbyResponse.ok
      ? ((await nearbyResponse.json()) as OWMNearbyResponse)
      : null;

    return normaliseWeather(currentData, nearbyData?.list ?? []);
  } catch (err) {
    console.error('[weather] Fetch failed:', err);
    return null;
  }
}
