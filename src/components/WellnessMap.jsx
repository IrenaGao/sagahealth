import { useEffect, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 40.7484,
  lng: -73.9857,
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
};

export default function WellnessMap({ listings, highlightedId, onMarkerClick, userLocation }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
  });

  const mapRef = useRef(null);

  // Update center when userLocation changes
  useEffect(() => {
    if (userLocation) {
      console.log('Centering map on user location:', userLocation)
      setMapCenter({
        lat: userLocation.lat,
        lng: userLocation.lng
      })
      
      // Pan map to user location if already loaded
      if (mapRef.current) {
        mapRef.current.panTo({
          lat: userLocation.lat,
          lng: userLocation.lng
        })
        mapRef.current.setZoom(12)
      }
    }
  }, [userLocation])

  // Check if API key is missing
  if (!apiKey) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Google Maps API Key Required</h3>
          <p className="text-gray-600 mb-4">
            To use the map, you need to add your Google Maps API key.
          </p>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-left">
            <p className="text-sm font-semibold text-emerald-900 mb-2">Quick Setup:</p>
            <ol className="text-sm text-emerald-800 space-y-1 list-decimal list-inside">
              <li>Create <code className="bg-white px-1 rounded">.env</code> file</li>
              <li>Add: <code className="bg-white px-1 rounded text-xs">VITE_GOOGLE_MAPS_API_KEY=your_key</code></li>
              <li>Restart the dev server</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // Check for loading errors
  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-50 p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-red-900 mb-2">Maps Loading Error</h3>
          <p className="text-red-700 mb-4">
            {loadError.message || 'Failed to load Google Maps'}
          </p>
          <div className="bg-white border border-red-200 rounded-xl p-4 text-left">
            <p className="text-sm font-semibold text-red-900 mb-2">Common fixes:</p>
            <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
              <li>Check your API key is correct</li>
              <li>Enable Maps JavaScript API in Google Cloud</li>
              <li>Check API key restrictions</li>
              <li>Restart dev server after changes</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const onLoad = (map) => {
    mapRef.current = map;
  };

  // Fit bounds to show all markers
  useEffect(() => {
    if (!mapRef.current || listings.length === 0) return;

    // If userLocation is set, we'll handle centering separately
    if (userLocation) return;

    const bounds = new window.google.maps.LatLngBounds();
    listings.forEach((listing) => {
      bounds.extend({
        lat: listing.coordinates.lat,
        lng: listing.coordinates.lng,
      });
    });

    mapRef.current.fitBounds(bounds);
    
    // Prevent over-zooming on single result
    const listener = window.google.maps.event.addListenerOnce(mapRef.current, 'bounds_changed', () => {
      if (mapRef.current && mapRef.current.getZoom() > 14) {
        mapRef.current.setZoom(14);
      }
    });

    return () => {
      window.google.maps.event.removeListener(listener);
    };
  }, [listings]);

  // Pan to highlighted marker with smooth animation
  useEffect(() => {
    if (!mapRef.current || !highlightedId) return;

    const listing = listings.find((l) => l.id === highlightedId);
    if (listing) {
      // Smooth pan to the location
      mapRef.current.panTo({
        lat: listing.coordinates.lat,
        lng: listing.coordinates.lng,
      });
      
      // Smoothly zoom to the marker after a brief delay for better UX
      setTimeout(() => {
        if (mapRef.current) {
          const currentZoom = mapRef.current.getZoom();
          if (currentZoom < 13) {
            mapRef.current.setZoom(13);
          }
        }
      }, 300);
    }
  }, [highlightedId, listings]);

  // Create custom marker icons
  const getMarkerIcon = (isHighlighted) => {
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: isHighlighted ? '#10b981' : '#6ee7b7',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: isHighlighted ? 10 : 8,
    };
  };

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={mapCenter}
      zoom={12}
      options={mapOptions}
      onLoad={onLoad}
      onClick={() => setSelectedMarker(null)}
    >
      {listings.map((listing) => (
        <Marker
          key={listing.id}
          position={{
            lat: listing.coordinates.lat,
            lng: listing.coordinates.lng,
          }}
          icon={getMarkerIcon(highlightedId === listing.id)}
          onClick={() => {
            onMarkerClick(listing.id);
            setSelectedMarker(listing.id);
          }}
        />
      ))}
      
      {/* Info Window */}
      {selectedMarker && listings.find(l => l.id === selectedMarker) && (
        <InfoWindow
          position={{
            lat: listings.find(l => l.id === selectedMarker).coordinates.lat,
            lng: listings.find(l => l.id === selectedMarker).coordinates.lng,
          }}
          onCloseClick={() => setSelectedMarker(null)}
          options={{
            pixelOffset: new window.google.maps.Size(0, -30),
            maxWidth: 300,
            disableAutoPan: false,
          }}
        >
          <div className="p-4">
            <div className="mb-2">
              <h3 className="font-semibold text-base text-gray-900 mb-1">
                {listings.find(l => l.id === selectedMarker).name}
              </h3>
              {listings.find(l => l.id === selectedMarker).category && (
                <span className="inline-block px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-lg">
                  {listings.find(l => l.id === selectedMarker).category}
                </span>
              )}
            </div>
            
            {/* Rating and Reviews */}
            {(listings.find(l => l.id === selectedMarker).rating || 
              listings.find(l => l.id === selectedMarker).reviewCount > 0) && (
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {listings.find(l => l.id === selectedMarker).rating && (
                  <div className="flex items-center">
                    <span className="text-yellow-400 text-sm">★</span>
                    <span className="ml-1 text-sm font-medium text-gray-900">
                      {listings.find(l => l.id === selectedMarker).rating.toFixed(1)}
                    </span>
                  </div>
                )}
                {listings.find(l => l.id === selectedMarker).reviewCount > 0 && (
                  <span className="text-sm text-gray-500">
                    ({listings.find(l => l.id === selectedMarker).reviewCount} reviews)
                  </span>
                )}
              </div>
            )}
            
            {/* Address */}
            {listings.find(l => l.id === selectedMarker).address && (
              <p className="text-sm text-gray-600 mb-3">
                📍 {listings.find(l => l.id === selectedMarker).address}
              </p>
            )}
            
            {/* Book Now Link */}
            {listings.find(l => l.id === selectedMarker).bookingLink && (
              <a
                href={listings.find(l => l.id === selectedMarker).bookingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                📅 Book Now →
              </a>
            )}
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}

