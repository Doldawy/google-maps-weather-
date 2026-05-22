/**
 * config/mapStyles.ts
 *
 * Driver-mode map style: high contrast, warm amber/orange tones,
 * dark background – optimised for night driving while still readable
 * in daylight.
 */

export const driverMapStyles: google.maps.MapTypeStyle[] = [
  // Geometry base – very dark slate
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },

  // Road labels
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#1a1a2e' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d4a853' }],
  },

  // Administrative
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#2c2c4a' }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d4a853' }],
  },
  {
    featureType: 'administrative.land_parcel',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f0c060' }],
  },

  // Points of interest
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#c09040' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#1e3320' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4a7a40' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#1a1a2e' }],
  },

  // Roads
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#2c2c4a' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212138' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d4a853' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#1a1a2e' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#3a3a5c' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#6b4c1e' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#4a3410' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f0c060' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#1a1a2e' }],
  },

  // Transit
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2a2a48' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d4a853' }],
  },

  // Water
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0d1b2a' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3a5f8a' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#0d1b2a' }],
  },
];
