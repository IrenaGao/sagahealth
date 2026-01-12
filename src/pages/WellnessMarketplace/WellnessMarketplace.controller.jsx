import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import WellnessMarketplaceView from "./WellnessMarketplace.view";
import { useFilterStore } from "../../components/Filters/filterStore";
import { loadGoogleMaps } from "../../utils/googleMapsLoader";
import {
  geocodeAddress as geocodeAddressWithMaps,
  reverseGeocode,
} from "../../utils/googleGeocoding";
import { API_URL } from "../../config";
import { INCLUDED_TYPES } from "../../config/wellnessCategories";

// Stock photos for different wellness types (multiple options per type)
const STOCK_PHOTOS = {
  spa: [
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=450&fit=crop", // Spa interior
    "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800&h=450&fit=crop", // Spa treatment room
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=450&fit=crop", // Spa with stones
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=450&fit=crop", // Modern spa
  ],
  gym: [
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=450&fit=crop", // Gym equipment
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=450&fit=crop", // Fitness center
    "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&h=450&fit=crop", // Workout area
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=450&fit=crop", // Modern gym
  ],
  chiropractor: [
    "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=450&fit=crop", // Chiropractic office
    "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&h=450&fit=crop", // Medical office
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=450&fit=crop", // Healthcare facility
    "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&h=450&fit=crop", // Medical consultation room
  ],
  beauty_salon: [
    "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=450&fit=crop", // Beauty salon
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=450&fit=crop", // Salon interior
    "https://images.unsplash.com/photo-1622296089863-9a17db4820ce?w=800&h=450&fit=crop", // Beauty treatment room
    "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&h=450&fit=crop", // Stylish salon
  ],
  hair_care: [
    "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&h=450&fit=crop", // Hair salon
    "https://images.unsplash.com/photo-1521590832167-7bcbf0ab8868?w=800&h=450&fit=crop", // Hair styling station
    "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=450&fit=crop", // Hair salon interior
    "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&h=450&fit=crop", // Hair care facility
  ],
  massage: [
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=450&fit=crop", // Massage/spa
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=450&fit=crop", // Massage table
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=450&fit=crop", // Therapy room
    "https://images.unsplash.com/photo-1506629905607-0b5ab9a9e21a?w=800&h=450&fit=crop", // Wellness massage
  ],
  sauna: [
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=450&fit=crop", // Sauna
    "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&h=450&fit=crop", // Steam room
    "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=800&h=450&fit=crop", // Relaxation space
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=450&fit=crop", // Wellness facility
  ],
  wellness_center: [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=450&fit=crop", // Wellness center
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=450&fit=crop", // Holistic center
    "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=450&fit=crop", // Health center
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=450&fit=crop", // Wellness space
  ],
  yoga_studio: [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=450&fit=crop", // Yoga studio
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=450&fit=crop", // Meditation space
    "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&h=450&fit=crop", // Peaceful studio
    "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&h=450&fit=crop", // Yoga room
  ],
  default: [
    "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=450&fit=crop", // Default wellness
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=450&fit=crop", // Healthcare
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=450&fit=crop", // Wellness
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=450&fit=crop", // Relaxation
  ]
};

// Track used photos to avoid duplicates on the same page
let usedPhotos = new Set();

// Get stock photo URL based on place type (ensures no duplicates)
const getStockPhotoForType = (types) => {
  if (!types || types.length === 0) {
    return getUniquePhoto(STOCK_PHOTOS.default);
  }

  // Check for specific types in order of preference
  const typePriority = ['spa', 'yoga_studio', 'gym', 'massage', 'wellness_center', 'chiropractor', 'beauty_salon', 'hair_care', 'sauna'];

  for (const priorityType of typePriority) {
    if (types.includes(priorityType)) {
      const photoArray = STOCK_PHOTOS[priorityType];
      if (photoArray && photoArray.length > 0) {
        return getUniquePhoto(photoArray);
      }
    }
  }

  // If no specific match, return default
  return getUniquePhoto(STOCK_PHOTOS.default);
};

// Helper function to get a unique photo that hasn't been used yet
const getUniquePhoto = (photoArray) => {
  // Filter out already used photos
  const availablePhotos = photoArray.filter(photo => !usedPhotos.has(photo));

  // If no available photos, reset and start over (shouldn't happen with our photo count)
  if (availablePhotos.length === 0) {
    usedPhotos.clear();
    return photoArray[Math.floor(Math.random() * photoArray.length)];
  }

  // Select random available photo
  const selectedPhoto = availablePhotos[Math.floor(Math.random() * availablePhotos.length)];

  // Mark as used
  usedPhotos.add(selectedPhoto);

  return selectedPhoto;
};

// Reset used photos when fetching new data
const resetUsedPhotos = () => {
  usedPhotos.clear();
};

export default function WellnessMarketplace() {
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [googlePlacesProviders, setGooglePlacesProviders] = useState([]);
  const [highlightedId, setHighlightedId] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [googlePlacesLoading, setGooglePlacesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const listRefs = useRef({});
  const ITEMS_PER_PAGE = 6;
  
  // Get filter values from Zustand store
  const searchQuery = useFilterStore((state) => state.searchQuery);
  const setSearchQuery = useFilterStore((state) => state.setSearchQuery);
  const filters = useFilterStore((state) => state.filters);
  const userLocation = useFilterStore((state) => state.userLocation);
  const setUserLocation = useFilterStore((state) => state.setUserLocation);
  
  const selectedCategory = filters.category;
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Fetch providers from Supabase and Google Places when userLocation changes
  useEffect(() => {
    fetchProviders();
  }, [userLocation]);

  // Ask for location permission on first visit
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

  // Load Google Maps JS (non-blocking; UI renders immediately)
  useEffect(() => {
    loadGoogleMaps({ apiKey: googleMapsApiKey, libraries: ["places"] }).catch(
      (e) => {
        console.error("Failed to load Google Maps JS:", e);
      }
    );
  }, [googleMapsApiKey]);

  // Calculate distance between two coordinates in miles using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959; // Earth's radius in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Geocode address to coordinates
  const geocodeAddress = async (address) => {
    if (!address) return { lat: 40.7484, lng: -73.9857 }; // Default NYC center

    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) return { lat: 40.7484, lng: -73.9857 };

      const result = await geocodeAddressWithMaps({ apiKey, address });
      return { lat: result.lat, lng: result.lng };
    } catch (err) {
      console.error("Geocoding error for address:", address, err);
    }

    return { lat: 40.7484, lng: -73.9857 }; // Fallback to default
  };

  // Fetch Google Places nearby services using Places API (New) REST endpoint
  const fetchGooglePlaces = async (location) => {
    try {
      if (!location || !googleMapsApiKey) {
        console.log("fetchGooglePlaces: Missing location or API key", { location, hasApiKey: !!googleMapsApiKey });
        return [];
      }

      const { lat, lng } = location;
      // Fixed 50 miles radius, converted to meters and capped at 50000 meters (API limit)
      const radiusMeters = Math.min(50 * 1609.34, 50000);

      const requestBody = {
        includedTypes: INCLUDED_TYPES,
        excludedTypes: ["lodging"],
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: {
              latitude: lat,
              longitude: lng,
            },
            radius: radiusMeters,
          },
        },
      };

      console.log("fetchGooglePlaces: Making request", { lat, lng, radiusMeters, requestBody });

      // Use the modern Places API (New) REST endpoint
      const response = await fetch(
        "https://places.googleapis.com/v1/places:searchNearby",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": googleMapsApiKey,
            "X-Goog-FieldMask":
              "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types,places.googleMapsUri",
          },
          body: JSON.stringify(requestBody),
        }
      );

      const responseText = await response.text();
      console.log("fetchGooglePlaces: Response status", response.status);
      console.log("fetchGooglePlaces: Response body", responseText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { raw: responseText };
        }
        console.error("Places API (New) error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        setGooglePlacesProviders([]);
        return [];
      }

      const data = JSON.parse(responseText);
      const places = data.places || [];

      console.log("fetchGooglePlaces: Found places", places.length);

      const mappedPlaces = places.map((place) => {
        const coordinates = {
          lat: place.location?.latitude ?? lat,
          lng: place.location?.longitude ?? lng,
        };
        const placeId = place.id || `gplace-${Date.now()}-${Math.random()}`;
        const id = `gplace-${placeId}`;

        // Extract address from formattedAddress or use fallback
        const address =
          place.formattedAddress || place.displayName?.text || "";

        // Filter categories to only include types that are in INCLUDED_TYPES
        const filteredCategories = (place.types || []).filter((type) =>
          INCLUDED_TYPES.includes(type)
        );

        // Get stock photo URL based on place types
        const imageUrl = getStockPhotoForType(filteredCategories);

        return {
          id,
          order: null,
          name: place.displayName?.text || "Unnamed Place",
          categories: filteredCategories.length > 0 ? filteredCategories : ["Other"],
          business_type: filteredCategories.length > 0 ? filteredCategories[0] : "Other", // Primary type for compatibility
          description: address,
          bookingLink: place.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${placeId}`,
          rating: place.rating ?? null,
          reviewCount: place.userRatingCount ?? 0,
          address: address,
          image: imageUrl,
          neighborhood: "",
          city: "",
          coordinates,
          bookingSystemEnabled: false,
          stripeAcctId: null,
          isGooglePlace: true,
        };
      });

      setGooglePlacesProviders(mappedPlaces);
      return mappedPlaces;
    } catch (err) {
      console.error("Error fetching Google Places", err);
      setGooglePlacesProviders([]);
      return [];
    }
  };

  const fetchProviders = async () => {
    try {
      setLoading(true);
      // Reset used photos for fresh selection
      resetUsedPhotos();
      // Fetch Supabase providers
      const { data, error } = await supabase
        .from("providers")
        .select("*")
        .order("id", { ascending: true });

      // Fetch Google Places providers if userLocation is available
      let googleData = [];
      if (userLocation) {
        setGooglePlacesLoading(true);
        try {
          googleData = await fetchGooglePlaces(userLocation);
          console.log("Fetched Google Places providers:", googleData.length);
        } catch (googleError) {
          console.error("Error fetching Google Places:", googleError);
          // Don't fail completely, just continue with Supabase providers
        } finally {
          setGooglePlacesLoading(false);
        }
      }

      console.log("userLocation", { userLocation, googleData });

      if (error) {
        setError(`Error: ${error.message}`);
        console.error("Error fetching providers:", error);
      } else {
        // Map database fields to frontend expectations and geocode addresses
        const mappedDataPromises = (data || []).map(async (provider) => {
          const coordinates = await geocodeAddress(provider.address);
          // Handle business_type as array or single value
          let categories = [];
          if (Array.isArray(provider.business_type)) {
            categories = provider.business_type;
          } else if (provider.business_type) {
            categories = [provider.business_type];
          } else {
            categories = ["Other"];
          }
          return {
            id: provider.id,
            order: provider.order ?? null,
            name: provider.business_name || "Unnamed Business",
            categories: categories, // Now an array
            business_type: categories[0] || "Other", // Primary business type for compatibility
            description: provider.short_summary || "",
            bookingLink: provider.booking_link || "",
            rating: provider.rating || null,
            reviewCount: provider.num_reviews || 0,
            address: provider.address || "",
            // Use provider's custom image if available, otherwise use stock photo based on type
            image: provider.image || getStockPhotoForType(categories),
            neighborhood: "",
            city: "",
            coordinates: coordinates,
            bookingSystemEnabled: provider.booking_system !== false,
            stripeAcctId: provider.stripe_acct_id || null,
          };
        });
        const mappedData = await Promise.all(mappedDataPromises);
        // Sort by order first (nulls last), then by id
        mappedData.sort((a, b) => {
          if (a.order !== null && b.order !== null) {
            if (a.order !== b.order) {
              return a.order - b.order;
            }
          }
          if (a.order !== null && b.order === null) {
            return -1;
          }
          if (a.order === null && b.order !== null) {
            return 1;
          }
          return a.id - b.id;
        });
        // Append Google Places providers
        const allProviders = [...mappedData, ...googleData];
        console.log(
          "Mapped data with coordinates and Google Places:",
          allProviders
        );
        setProviders(allProviders);
        setError(null);
      }
    } catch (err) {
      setError(`Failed to fetch: ${err.message}`);
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter listings based on category and location
  const filteredListings = useMemo(() => {
    console.log("=== FILTERING PROVIDERS ===");
    console.log("Total providers:", providers.length);
    console.log("Selected category:", selectedCategory);
    console.log(
      "User location:",
      userLocation
        ? `${userLocation.address} (${userLocation.lat}, ${userLocation.lng})`
        : "null"
    );

    // Don't show any providers until location is set
    if (!userLocation) {
      console.log("No location set, returning empty list");
      return [];
    }

    return providers.filter((provider) => {
      const matchesCategory =
        selectedCategory === "all" ||
        provider.categories?.some(
          (cat) => cat.toLowerCase() === selectedCategory.toLowerCase()
        );

      // Location-based filtering (fixed 50 miles)
      const matchesLocation =
        !userLocation ||
        (provider.coordinates &&
          calculateDistance(
            userLocation.lat,
            userLocation.lng,
            provider.coordinates.lat,
            provider.coordinates.lng
          ) <= 50); // Fixed 50 miles

      return matchesCategory && matchesLocation;
    });
  }, [providers, selectedCategory, userLocation]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
    }, [
      selectedCategory,
      userLocation,
      providers.length,
    ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredListings.length / ITEMS_PER_PAGE)
  );
  const paginatedListings = filteredListings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Handle card click - highlight and scroll to on map
  const handleCardClick = (id) => {
    setHighlightedId(id);
  };

  // Handle marker click - highlight and scroll to card
  const handleMarkerClick = (id) => {
    setHighlightedId(id);

    // Scroll to the card
    const element = listRefs.current[id];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Handle navigation to LMN form
  const handleNavigateToLMN = () => {
    navigate("/book/any-provider/lmn-form", {
      state: { bookingSystemEnabled: false },
    });
  };

  return (
    <WellnessMarketplaceView
        loading={loading}
        googlePlacesLoading={googlePlacesLoading}
        error={error}
        filteredListings={filteredListings}
        paginatedListings={paginatedListings}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        listRefs={listRefs}
        highlightedId={highlightedId}
        onCardClick={handleCardClick}
        onMarkerClick={handleMarkerClick}
        onRetry={fetchProviders}
        onNavigateToLMN={handleNavigateToLMN}
        itemsPerPage={ITEMS_PER_PAGE}
      />
  );
}
