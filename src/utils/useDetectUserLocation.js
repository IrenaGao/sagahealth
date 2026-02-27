import { useEffect } from "react";
import { reverseGeocode } from "./googleGeocoding";

/**
 * Custom hook to detect user's location using browser geolocation API
 * Attempts high accuracy first, then falls back to low accuracy if timeout occurs
 * Includes reverse geocoding to get a readable address
 * 
 * @param {Object} userLocation - Current user location from store (to avoid re-requesting)
 * @param {Function} setUserLocation - Function to update user location in store
 */
export function useDetectUserLocation(userLocation, setUserLocation) {
  useEffect(() => {
    const requestLocationPermission = async () => {
      // Wait a bit for page to fully load
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!("geolocation" in navigator) || userLocation) {
        console.log("Geolocation not supported or location already set");
        return;
      }

      // Check current permission state if Permissions API is available
      if ("permissions" in navigator) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
          console.log("permission state:", permissionStatus.state);

          if (permissionStatus.state === 'denied') {
            console.log("Location permission already denied, skipping request");
            return;
          }

          // Listen for permission changes
          permissionStatus.addEventListener('change', () => {
            console.log("Permission state changed to:", permissionStatus.state);
          });
        } catch (error) {
          console.log("Could not query permission state:", error);
        }
      }

      console.log("Requesting location permission...");

      // Helper function to reverse geocode and set location
      const setLocationWithReverseGeocode = async (latitude, longitude, accuracyLabel) => {
        console.log(`Location permission granted, coordinates received (${accuracyLabel})`);
        console.log(`Coordinates: ${latitude}, ${longitude}`);

        // Always try reverse geocoding first for better UX
        try {
          const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
          if (apiKey) {
            console.log("🔄 Reverse geocoding coordinates...");
            const readableAddress = await reverseGeocode({
              apiKey,
              lat: latitude,
              lng: longitude,
            });

            if (readableAddress) {
              console.log("✅ Reverse geocoding successful:", readableAddress);
              const locationData = {
                lat: latitude,
                lng: longitude,
                address: readableAddress,
              };
              setUserLocation(locationData);
              return;
            } else {
              console.warn("⚠️ Reverse geocoding returned no results");
            }
          } else {
            console.warn("⚠️ No Google Maps API key for reverse geocoding");
          }
        } catch (error) {
          console.error("❌ Reverse geocoding failed:", error);
        }

        // Fallback: Create a basic city/state format from coordinates
        console.log("📍 Using coordinate-based location");
        // For better UX, try to get approximate city from coordinates
        // This is a simple approximation - in production you'd want better geocoding
        let approximateLocation = "Your Location";
        if (latitude && longitude) {
          // Very basic approximation for major US cities
          if (latitude > 40.6 && latitude < 40.8 && longitude > -74.1 && longitude < -73.9) {
            approximateLocation = "New York, NY";
          } else if (latitude > 34.0 && latitude < 34.2 && longitude > -118.3 && longitude < -118.1) {
            approximateLocation = "Los Angeles, CA";
          } else if (latitude > 41.8 && latitude < 42.0 && longitude > -87.7 && longitude < -87.5) {
            approximateLocation = "Chicago, IL";
          }
          // Add more city approximations as needed
        }

        const locationData = {
          lat: latitude,
          lng: longitude,
          address: approximateLocation,
        };
        setUserLocation(locationData);
      };

      // Try high accuracy first, then fall back to low accuracy if it times out
      const tryHighAccuracy = () => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            await setLocationWithReverseGeocode(latitude, longitude, "high accuracy");
          },
          (error) => {
            console.log(`High accuracy location failed (${error.code}):`, error.message);

            // If high accuracy fails with timeout, try low accuracy as fallback
            if (error.code === 3) { // TIMEOUT
              console.log("Trying low accuracy location as fallback...");
              tryLowAccuracy();
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 30000, // 30 seconds for high accuracy
            maximumAge: 600000, // Accept cached location up to 10 minutes old
          }
        );
      };

      const tryLowAccuracy = () => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            await setLocationWithReverseGeocode(latitude, longitude, "low accuracy fallback");
          },
          (error) => {
            console.log(`Low accuracy location also failed (${error.code}):`, error.message);
          },
          {
            enableHighAccuracy: false,
            timeout: 20000, // 20 seconds for low accuracy
            maximumAge: 600000, // Accept cached location up to 10 minutes old
          }
        );
      };

      // Start with high accuracy attempt
      tryHighAccuracy();
    };

    requestLocationPermission();
  }, []); // Only run once on mount
}
