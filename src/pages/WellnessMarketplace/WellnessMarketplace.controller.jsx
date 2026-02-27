import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import WellnessMarketplaceView from "./WellnessMarketplace.view";
import { useFilterStore } from "../../components/Filters/filterStore";
import { loadGoogleMaps } from "../../utils/googleMapsLoader";
import { INCLUDED_TYPES } from "../../config/wellnessCategories";
import { getStockPhotoForType, resetUsedPhotos } from "../../config/stockPhotos";
import { useDetectUserLocation } from "../../utils/useDetectUserLocation";

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
  const searchDebounceRef = useRef(null);
  const ITEMS_PER_PAGE = 6;
  
  // Get filter values from Zustand store
  const filters = useFilterStore((state) => state.filters);
  const userLocation = useFilterStore((state) => state.userLocation);
  const setUserLocation = useFilterStore((state) => state.setUserLocation);
  
  const selectedCategory = filters.category;
  const searchQuery = useFilterStore((state) => state.searchQuery);
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Cache for search results based on location
  const cacheRef = useRef({
    location: null,
    allProviders: null, // Combined Supabase + Google Places providers
    googleProviders: null, // Google Places providers only (for separate tracking)
  });

  // Track ongoing API requests to prevent duplicates (especially important in StrictMode)
  const ongoingRequestRef = useRef({
    googlePlaces: null, // Store promise to deduplicate concurrent calls
  });

  // Helper function to check if location has changed
  const hasLocationChanged = (newLocation) => {
    const cachedLocation = cacheRef.current.location;
    
    // If no cached location, it's a change
    if (!cachedLocation && newLocation) return true;
    
    // If no new location but had cached, it's a change
    if (cachedLocation && !newLocation) return true;
    
    // Both null/undefined, no change
    if (!cachedLocation && !newLocation) return false;
    
    // Compare lat/lng (with small tolerance for floating point)
    const latChanged = Math.abs(cachedLocation.lat - newLocation.lat) > 0.0001;
    const lngChanged = Math.abs(cachedLocation.lng - newLocation.lng) > 0.0001;
    
    return latChanged || lngChanged;
  };

  // Fetch providers from Supabase and Google Places when userLocation changes
  useEffect(() => {
    // Check if location has actually changed
    if (!hasLocationChanged(userLocation)) {
      console.log("Location unchanged, using cached results");
      
      // If we have cached data, restore it
      if (cacheRef.current.allProviders) {
        setProviders(cacheRef.current.allProviders);
        setGooglePlacesProviders(cacheRef.current.googleProviders || []);
        setLoading(false);
      } else {
        // First load, fetch data
        fetchProviders();
      }
    } else {
      console.log("Location changed, fetching new results");
      fetchProviders();
    }
  }, [userLocation]);

  // Detect user location on first visit
  useDetectUserLocation(userLocation, setUserLocation);

  // Re-query Google Places when search text changes (debounced)
  useEffect(() => {
    if (!userLocation) return;

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(async () => {
      setGooglePlacesLoading(true);
      try {
        const query = searchQuery.trim() || null;
        const googleData = await fetchGooglePlaces(userLocation, query);
        setProviders((prev) => {
          const supabaseProviders = prev.filter((p) => !p.isGooglePlace);
          return [...supabaseProviders, ...googleData];
        });
        cacheRef.current.googleProviders = googleData;
      } finally {
        setGooglePlacesLoading(false);
      }
    }, 800);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery, userLocation]);

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

  // Fetch Google Places services using Places API (New) text search endpoint
  const fetchGooglePlaces = async (location, query = null) => {
    try {
      if (!location || !googleMapsApiKey) {
        console.log("fetchGooglePlaces: Missing location or API key", { location, hasApiKey: !!googleMapsApiKey });
        return [];
      }

      // Check if there's already an ongoing request for this location
      if (ongoingRequestRef.current.googlePlaces) {
        console.log("fetchGooglePlaces: Returning existing request (deduplication)");
        return await ongoingRequestRef.current.googlePlaces;
      }

      const { lat, lng } = location;
      
      // Create and store the promise for deduplication
      const requestPromise = (async () => {
        try {
          // Fixed 50 miles radius, converted to meters and capped at 50000 meters (API limit)
          const radiusMeters = Math.min(50 * 1609.34, 50000);

          const requestBody = {
            textQuery: query || "spa yoga fitness wellness massage chiropractor sauna beauty salon",
            maxResultCount: 20,
            locationBias: {
              circle: {
                center: {
                  latitude: lat,
                  longitude: lng,
                },
                radius: radiusMeters,
              },
            },
          };

          console.log("fetchGooglePlaces: Making NEW request", { lat, lng, radiusMeters, requestBody });

          // Use the Places API (New) text search endpoint
          const response = await fetch(
            "https://places.googleapis.com/v1/places:searchText",
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
              stripeAcctId: null,
              isGooglePlace: true,
            };
          });

          setGooglePlacesProviders(mappedPlaces);
          return mappedPlaces;
        } finally {
          // Clear the ongoing request reference when done
          ongoingRequestRef.current.googlePlaces = null;
        }
      })();

      // Store the promise so duplicate calls can reuse it
      ongoingRequestRef.current.googlePlaces = requestPromise;
      
      // Return the promise result
      return await requestPromise;
    } catch (err) {
      console.error("Error fetching Google Places", err);
      setGooglePlacesProviders([]);
      // Clear the ongoing request reference on error
      ongoingRequestRef.current.googlePlaces = null;
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
        // Map database fields to frontend expectations
        const mappedDataPromises = (data || []).map(async (provider) => {
          // Use stored coordinates from database (no geocoding needed!)
          const coordinates = provider.latitude && provider.longitude
            ? { lat: provider.latitude, lng: provider.longitude }
            : { lat: 40.7484, lng: -73.9857 }; // Fallback to NYC if no coordinates
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
        
        // Update cache with new results
        cacheRef.current = {
          location: userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : null,
          allProviders: allProviders, // Combined Supabase + Google Places
          googleProviders: googleData, // Google Places only
        };
        console.log("Cache updated with new results for location:", userLocation);
        
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

    const query = searchQuery.trim().toLowerCase();

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
          ) <= 50);

      // Text search filtering for Supabase providers (Google Places already filtered by query)
      const matchesSearch =
        !query ||
        provider.isGooglePlace ||
        provider.name?.toLowerCase().includes(query) ||
        provider.description?.toLowerCase().includes(query) ||
        provider.categories?.some((cat) => cat.toLowerCase().includes(query));

      return matchesCategory && matchesLocation && matchesSearch;
    });
  }, [providers, selectedCategory, userLocation, searchQuery]);

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
    navigate("/book/any-provider/lmn-form");
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
