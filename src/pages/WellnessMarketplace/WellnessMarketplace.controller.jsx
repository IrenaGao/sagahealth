import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import WellnessMarketplaceView from "./WellnessMarketplace.view";
import { loadGoogleMaps } from "../../utils/googleMapsLoader";
import {
  geocodeAddress as geocodeAddressWithMaps,
  reverseGeocode,
} from "../../utils/googleGeocoding";
import { API_URL } from "../../config";

export default function WellnessMarketplace() {
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [googlePlacesProviders, setGooglePlacesProviders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBookableFilter, setSelectedBookableFilter] = useState("All");
  const [highlightedId, setHighlightedId] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [userLocation, setUserLocation] = useState(null);
  const listRefs = useRef({});
  const ITEMS_PER_PAGE = 6;
  const [radiusMiles, setRadiusMiles] = useState(50);
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Fetch providers from Supabase and Google Places when userLocation changes
  useEffect(() => {
    fetchProviders();
  }, [userLocation]);

  // Request user's location on page load
  useEffect(() => {
    const getLocationFromIP = async () => {
      try {
        console.log("📍 Attempting IP-based location...");
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();

        if (data.latitude && data.longitude) {
          const locationData = {
            lat: data.latitude,
            lng: data.longitude,
            address: `${data.city}, ${data.region_code}, ${data.country_name}`,
          };
          console.log("✅ IP-based location:", locationData);
          setUserLocation(locationData);
        }
      } catch (error) {
        console.error("❌ IP-based location failed:", error);
      }
    };

    console.log("Checking for geolocation support...");
    if ("geolocation" in navigator) {
      console.log("Requesting user location...");
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log("✅ User coordinates received:", latitude, longitude);

          // Reverse geocode to get address
          try {
            const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
            if (!apiKey) {
              console.error("Google Maps API key not configured");
              return;
            }

            const formattedAddress = await reverseGeocode({
              apiKey,
              lat: latitude,
              lng: longitude,
            });

            if (formattedAddress) {
              const locationData = {
                lat: latitude,
                lng: longitude,
                address: formattedAddress,
              };
              console.log("✅ Auto-detected location:", locationData);
              console.log("Setting user location state...");
              setUserLocation(locationData);
              console.log("✅ User location state updated");
            } else {
              console.error(
                "No reverse geocoding results found, trying IP-based location"
              );
              getLocationFromIP();
            }
          } catch (error) {
            console.error("❌ Error reverse geocoding user location:", error);
            getLocationFromIP();
          }
        },
        (error) => {
          console.log(
            "❌ User denied location permission or error occurred:",
            error.message,
            error.code
          );
          console.log("Falling back to IP-based location...");
          getLocationFromIP();
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    } else {
      console.log(
        "❌ Geolocation is not supported by this browser, using IP-based location"
      );
      getLocationFromIP();
    }
  }, []);

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

  // Fetch Google Places nearby services using Places Service API
  const fetchGooglePlaces = async (location) => {
    try {
      if (!location) return [];

      try {
        await loadGoogleMaps({ apiKey: googleMapsApiKey, libraries: ["places"] });
      } catch (e) {
        console.warn("Google Maps not loaded yet; skipping Places.", e);
        return [];
      }

      if (!window.google?.maps?.places) return [];

      const { lat, lng } = location;

      // Create a PlacesService instance
      const service = new window.google.maps.places.PlacesService(
        document.createElement("div")
      );

      const request = {
        location: new window.google.maps.LatLng(lat, lng),
        radius: radiusMiles * 1609.34, // Convert miles to meters
        // type: "health", // Can be customized: 'spa', 'gym', etc.
      };

      return new Promise((resolve) => {
        service.nearbySearch(request, (results, status) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            results
          ) {
            const mappedPlaces = results.map((place) => {
              const coordinates = {
                lat: place.geometry?.location?.lat(),
                lng: place.geometry?.location?.lng(),
              };
              const id = `gplace-${place.place_id}`;
              return {
                id,
                order: null,
                name: place.name || "Unnamed Place",
                categories: place.types || ["Other"],
                description: place.vicinity || "",
                bookingLink: place.place_id
                  ? `https://www.google.com/maps/place/?q=place_id:${place.place_id}`
                  : "",
                rating: place.rating ?? null,
                reviewCount: place.user_ratings_total ?? 0,
                address: place.vicinity || "",
                image:
                  "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=450&fit=crop",
                neighborhood: "",
                city: "",
                coordinates,
                bookingSystemEnabled: false,
                stripeAcctId: null,
                isGooglePlace: true,
              };
            });
            setGooglePlacesProviders(mappedPlaces);
            resolve(mappedPlaces);
          } else {
            console.error("Places search failed:", status);
            resolve([]);
          }
        });
      });
    } catch (err) {
      console.error("Error fetching Google Places", err);
      setGooglePlacesProviders([]);
      return [];
    }
  };

  const fetchProviders = async () => {
    try {
      setLoading(true);
      // Fetch Supabase providers
      const { data, error } = await supabase
        .from("providers")
        .select("*")
        .order("id", { ascending: true });

      // Fetch Google Places providers if userLocation is available
      let googleData = [];
      // if (userLocation) {
      googleData = await fetchGooglePlaces(userLocation);
      // }

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
            description: provider.short_summary || "",
            bookingLink: provider.booking_link || "",
            rating: provider.rating || null,
            reviewCount: provider.num_reviews || 0,
            address: provider.address || "",
            // Use provider image or default fallback
            image:
              provider.image ||
              "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=450&fit=crop",
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

    return providers.filter((provider) => {
      const matchesCategory =
        selectedCategory === "All" ||
        provider.categories?.some(
          (cat) => cat.toLowerCase() === selectedCategory.toLowerCase()
        );

      const matchesBookableFilter =
        selectedBookableFilter === "All" ||
        (selectedBookableFilter === "Bookable" &&
          provider.bookingSystemEnabled !== false) ||
        (selectedBookableFilter === "LMN Only" &&
          provider.bookingSystemEnabled === false);

      // Location-based filtering
      const matchesLocation =
        !userLocation ||
        (provider.coordinates &&
          calculateDistance(
            userLocation.lat,
            userLocation.lng,
            provider.coordinates.lat,
            provider.coordinates.lng
          ) <= radiusMiles);

      console.log(
        "Provider:",
        provider.name,
        "matchesCategory:",
        matchesCategory,
        "matchesBookableFilter:",
        matchesBookableFilter,
        "matchesLocation:",
        matchesLocation,
        "categories:",
        provider.categories
      );

      return matchesCategory && matchesBookableFilter && matchesLocation;
    });
  }, [providers, selectedCategory, selectedBookableFilter, userLocation]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedCategory,
    selectedBookableFilter,
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

  // Handle location selection
  const handleLocationSelect = (location) => {
    setUserLocation(location);
  };

  // Handle clearing location filter
  const handleClearLocation = () => {
    setUserLocation(null);
  };

  return (
    <WellnessMarketplaceView
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedBookableFilter={selectedBookableFilter}
        onBookableFilterChange={setSelectedBookableFilter}
        loading={loading}
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
        userLocation={userLocation}
        radiusMiles={radiusMiles}
        onRadiusChange={setRadiusMiles}
        onLocationSelect={handleLocationSelect}
        onClearLocation={handleClearLocation}
      />
  );
}
