import { loadGoogleMaps } from "./googleMapsLoader";

const DEFAULT_COORDS = { lat: 40.7484, lng: -73.9857 };

export async function geocodeAddress({ apiKey, address }) {
  if (!address) return { ...DEFAULT_COORDS, formattedAddress: null };

  await loadGoogleMaps({ apiKey });

  if (!window.google?.maps?.Geocoder) {
    throw new Error("Google Maps Geocoder not available");
  }

  const geocoder = new window.google.maps.Geocoder();

  return new Promise((resolve) => {
    geocoder.geocode({ address }, (results, status) => {
      if (!results || !results.length || status !== "OK") {
        resolve({ ...DEFAULT_COORDS, formattedAddress: null });
        return;
      }

      const location = results[0]?.geometry?.location;
      resolve({
        lat: typeof location?.lat === "function" ? location.lat() : location?.lat,
        lng: typeof location?.lng === "function" ? location.lng() : location?.lng,
        formattedAddress: results[0].formatted_address || null,
      });
    });
  });
}

export async function reverseGeocode({ apiKey, lat, lng }) {
  await loadGoogleMaps({ apiKey });

  if (!window.google?.maps?.Geocoder) {
    throw new Error("Google Maps Geocoder not available");
  }

  const geocoder = new window.google.maps.Geocoder();

  return new Promise((resolve) => {
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (!results || !results.length || status !== "OK") {
        resolve(null);
        return;
      }

      resolve(results[0].formatted_address || null);
    });
  });
}
