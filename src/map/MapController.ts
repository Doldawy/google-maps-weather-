/**
 * map/MapController.ts
 *
 * Responsible for loading the Google Maps JavaScript API dynamically,
 * initialising the map with driver-mode styles, and handling smooth
 * camera transitions.
 */

import { config } from '../config/env';
import { driverMapStyles } from '../config/mapStyles';

export class MapController {
  private map: google.maps.Map | null = null;
  private readonly containerId: string;

  constructor(containerId: string) {
    this.containerId = containerId;
  }

  /** Dynamically load the Maps JS API script then resolve with the map instance. */
  async init(): Promise<google.maps.Map> {
    await this.loadGoogleMapsScript();

    const container = document.getElementById(this.containerId);
    if (!container) {
      throw new Error(`Map container #${this.containerId} not found in DOM.`);
    }

    this.map = new google.maps.Map(container, {
      center: config.defaultCenter,
      zoom: config.defaultZoom,
      styles: driverMapStyles,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      tilt: 45, // Perspective tilt for driver-style look
      heading: 0,
      gestureHandling: 'greedy',
      backgroundColor: '#1a1a2e',
    });

    return this.map;
  }

  getMap(): google.maps.Map {
    if (!this.map) throw new Error('Map has not been initialised. Call init() first.');
    return this.map;
  }

  /**
   * Smoothly pan & zoom the camera to a new position.
   * Uses Maps `panTo` for position and animates zoom separately.
   */
  smoothMoveTo(latLng: google.maps.LatLngLiteral, zoom?: number): void {
    const map = this.getMap();
    map.panTo(latLng);
    if (zoom !== undefined) {
      setTimeout(() => map.setZoom(zoom), 300);
    }
  }

  /**
   * Centre the map on the user's current geolocation if available.
   */
  centreOnUserLocation(): void {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.smoothMoveTo({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (err) => {
        console.warn('Geolocation denied or unavailable:', err.message);
      },
    );
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private loadGoogleMapsScript(): Promise<void> {
    // If the global `google` object already exists, skip loading.
    if (typeof google !== 'undefined' && google.maps) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${config.googleMapsApiKey}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error('Failed to load Google Maps JavaScript API. Check your API key.'));
      document.head.appendChild(script);
    });
  }
}
