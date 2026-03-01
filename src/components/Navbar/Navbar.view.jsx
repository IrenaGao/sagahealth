import { useState, useEffect, useRef } from 'react'
import { geocodeAddress } from '../../utils/googleGeocoding'
import { useFilterStore } from '../Filters/filterStore'
import { getDisplayCategories, formatCategoryType } from '../../config/wellnessCategories'

const categories = getDisplayCategories();

export default function NavbarView({ onLogoClick, onBackClick, rightContent, hideSearch = false }) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Get state and actions from Zustand store
  const searchQuery = useFilterStore((state) => state.searchQuery);
  const setSearchQuery = useFilterStore((state) => state.setSearchQuery);
  const filters = useFilterStore((state) => state.filters);
  const setFilter = useFilterStore((state) => state.setFilter);
  const userLocation = useFilterStore((state) => state.userLocation);
  const setUserLocation = useFilterStore((state) => state.setUserLocation);

  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [locationInput, setLocationInput] = useState('')
  const locationInputRef = useRef(null)
  const autocompleteRef = useRef(null)

  // Sync location input when userLocation is set (e.g. auto-detected)
  useEffect(() => {
    if (userLocation?.address) {
      setLocationInput(userLocation.address.split(',').slice(0, 2).join(', '))
    }
  }, [userLocation])

  // Initialize Google Places Autocomplete on the location input
  useEffect(() => {
    const initAutocomplete = () => {
      if (!locationInputRef.current || !window.google?.maps?.places) return
      if (autocompleteRef.current) return // already initialized

      const autocomplete = new window.google.maps.places.Autocomplete(locationInputRef.current, {
        types: ['geocode'],
      })

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        if (place.geometry?.location) {
          const lat = place.geometry.location.lat()
          const lng = place.geometry.location.lng()
          setUserLocation({ lat, lng, address: place.formatted_address || place.name })
          setLocationInput(place.formatted_address || place.name)
        }
      })

      autocompleteRef.current = autocomplete
    }

    // Google Maps may not be loaded yet — poll briefly
    if (window.google?.maps?.places) {
      initAutocomplete()
    } else {
      const interval = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(interval)
          initAutocomplete()
        }
      }, 300)
      return () => clearInterval(interval)
    }
  }, [])

  const handleLocationSearch = async (query = locationInput) => {
    if (!query.trim()) return

    console.log('Searching for location:', query)
    setIsLoadingLocation(true)
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      if (!apiKey) {
        alert('Google Maps API key not configured')
        return
      }

      const result = await geocodeAddress({ apiKey, address: query })

      if (result?.lat && result?.lng) {
        const locationData = {
          lat: result.lat,
          lng: result.lng,
          address: result.formattedAddress || query,
        }
        console.log('Location found, calling setUserLocation:', locationData)
        setUserLocation(locationData)
      } else {
        console.error('Geocoding failed: No results found')
        alert('Location not found. Please try a different address.')
      }
    } catch (error) {
      console.error('Error geocoding location:', error)
      alert('Error finding location. Please try again.')
    } finally {
      setIsLoadingLocation(false)
    }
  }

  // Left input Enter: check for category match, otherwise leave as text search
  const handleTextSearch = () => {
    if (!searchQuery.trim()) return

    const queryLower = searchQuery.toLowerCase().trim()
    const matchedCategory = categories.find(cat => {
      if (cat === 'All') return false
      const catLower = cat.toLowerCase()
      const catType = formatCategoryType(cat)
      return catLower === queryLower ||
             catLower.replace(/\s+/g, '') === queryLower.replace(/\s+/g, '') ||
             catType === queryLower.replace(/\s+/g, '_')
    })

    if (matchedCategory && matchedCategory !== 'All') {
      const categoryType = formatCategoryType(matchedCategory)
      setFilter('category', categoryType)
      setSearchQuery('')
    } else if (filters.category !== 'all') {
      setFilter('category', 'all')
    }
  }

  const handleTextKeyPress = (e) => {
    if (e.key === 'Enter') handleTextSearch()
  }

  const handleLocationKeyPress = (e) => {
    if (e.key === 'Enter') handleLocationSearch()
  }

  return (
    <div className="bg-white sticky top-0 z-30">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-4 pb-2 md:pb-4">

        {/* Mobile layout */}
        {!hideSearch && (
          <div className="flex flex-col gap-2 md:hidden">
            {/* Row 1: Logo + hamburger */}
            <div className="flex items-center justify-between mb-2">
              <button onClick={onLogoClick} className="flex items-center gap-2 flex-shrink-0">
                <img src="/favicon.png" alt="Saga Health" className="w-8 h-8 object-contain" />
                <span className="text-xl font-bold text-gray-900">Saga Health</span>
              </button>
              {rightContent ? (
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  aria-label="Toggle menu"
                >
                  {menuOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              ) : (
                <button onClick={onBackClick} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
            </div>

            {/* Mobile nav dropdown */}
            {menuOpen && rightContent && (
              <div className="flex flex-col gap-4 py-3 px-1 border-t border-gray-100 mb-2 [&>div]:flex-col [&>div]:items-start" onClick={() => setMenuOpen(false)}>
                {rightContent}
              </div>
            )}
            {/* Row 2: Text search */}
            <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent bg-white">
              <div className="flex flex-1 items-center px-3 py-2.5 min-w-0">
                {filters.category !== 'all' && (
                  <div className="flex items-center gap-1 bg-emerald-100 px-2 py-0.5 rounded-lg mr-2 shrink-0">
                    <span className="text-xs text-emerald-800">{filters.category}</span>
                    <button onClick={() => setFilter('category', 'all')} className="text-emerald-600 hover:text-emerald-800 font-bold text-xs leading-none">✕</button>
                  </div>
                )}
                <input
                  type="text"
                  placeholder="Services, businesses..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); if (filters.category !== 'all') setFilter('category', 'all') }}
                  onKeyPress={handleTextKeyPress}
                  className="flex-1 text-sm outline-none text-gray-900 placeholder-gray-500 bg-transparent min-w-0"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="ml-1 text-gray-400 hover:text-gray-600 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            {/* Row 3: Location search */}
            <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent bg-white">
              <div className="flex flex-1 items-center px-3 py-2.5 min-w-0">
                <input
                  ref={locationInputRef}
                  type="text"
                  placeholder="Location"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyPress={handleLocationKeyPress}
                  disabled={isLoadingLocation}
                  className="flex-1 text-sm outline-none text-gray-900 placeholder-gray-500 bg-transparent min-w-0"
                />
              </div>
              <button
                onClick={() => handleLocationSearch()}
                disabled={isLoadingLocation}
                className="px-3 py-2.5 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                {isLoadingLocation ? (
                  <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Desktop layout: single row */}
        <div className={`${!hideSearch ? 'hidden md:flex' : 'flex'} items-center gap-4`}>
          {/* Logo */}
          <button onClick={onLogoClick} className="flex items-center gap-2 flex-shrink-0">
            <img src="/favicon.png" alt="Saga Health" className="w-8 h-8 object-contain" />
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">Saga Health</h1>
          </button>

          {/* Dual Search Bar */}
          {!hideSearch && (
            <div className="flex-1 max-w-4xl mx-2">
              <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent bg-white">
                {/* Left: Text / Category Search */}
                <div className="flex flex-[5] items-center px-3 py-2.5 min-w-0">
                  {filters.category !== 'all' && (
                    <div className="flex items-center gap-1 bg-emerald-100 px-2 py-0.5 rounded-lg mr-2 shrink-0">
                      <span className="text-xs text-emerald-800">{filters.category}</span>
                      <button onClick={() => setFilter('category', 'all')} className="text-emerald-600 hover:text-emerald-800 font-bold text-xs leading-none">✕</button>
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="Services, businesses..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); if (filters.category !== 'all') setFilter('category', 'all') }}
                    onKeyPress={handleTextKeyPress}
                    className="flex-1 text-sm outline-none text-gray-900 placeholder-gray-500 bg-transparent min-w-0"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="ml-1 text-gray-400 hover:text-gray-600 shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                {/* Divider */}
                <div className="w-px h-6 bg-gray-300 shrink-0" />
                {/* Right: Location Search */}
                <div className="flex flex-[2] items-center px-3 py-2.5 min-w-0 max-w-[180px]">
                  <input
                    ref={locationInputRef}
                    type="text"
                    placeholder="Location"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    onKeyPress={handleLocationKeyPress}
                    disabled={isLoadingLocation}
                    className="flex-1 text-sm outline-none text-gray-900 placeholder-gray-500 bg-transparent min-w-0"
                  />
                </div>
                {/* Search Button */}
                <button
                  onClick={() => handleLocationSearch()}
                  disabled={isLoadingLocation}
                  className="px-3 py-2.5 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  {isLoadingLocation ? (
                    <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Right Content */}
          <div className="ml-auto flex-shrink-0">
            {rightContent ? (
              rightContent
            ) : (
              <button
                onClick={onBackClick}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span className="font-medium hidden md:inline">Back to Marketplace</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
