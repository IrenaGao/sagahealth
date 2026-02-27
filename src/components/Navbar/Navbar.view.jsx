import { useState, useEffect } from 'react'
import { geocodeAddress } from '../../utils/googleGeocoding'
import { useFilterStore } from '../Filters/filterStore'
import { getDisplayCategories, formatCategoryType } from '../../config/wellnessCategories'

const categories = getDisplayCategories();

export default function NavbarView({ onLogoClick, onBackClick, rightContent, hideSearch = false }) {
  // Get state and actions from Zustand store
  const searchQuery = useFilterStore((state) => state.searchQuery);
  const setSearchQuery = useFilterStore((state) => state.setSearchQuery);
  const filters = useFilterStore((state) => state.filters);
  const setFilter = useFilterStore((state) => state.setFilter);
  const userLocation = useFilterStore((state) => state.userLocation);
  const setUserLocation = useFilterStore((state) => state.setUserLocation);
  
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile screen size
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }

    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  const handleLocationSearch = async (locationQuery = searchQuery) => {
    if (!locationQuery.trim()) return

    console.log('Searching for location:', locationQuery)
    setIsLoadingLocation(true)
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      if (!apiKey) {
        alert('Google Maps API key not configured')
        return
      }

      const result = await geocodeAddress({ apiKey, address: locationQuery })

      if (result?.lat && result?.lng) {
        const locationData = {
          lat: result.lat,
          lng: result.lng,
          address: result.formattedAddress || locationQuery,
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

  const handleSearch = () => {
    if (!searchQuery.trim()) return
    
    // Check if it matches a category first (case-insensitive, with or without spaces/underscores)
    const queryLower = searchQuery.toLowerCase().trim()
    const matchedCategory = categories.find(cat => {
      if (cat === 'All') return false
      const catLower = cat.toLowerCase()
      const catType = formatCategoryType(cat) // Convert display to type format
      return catLower === queryLower || 
             catLower.replace(/\s+/g, '') === queryLower.replace(/\s+/g, '') ||
             catType === queryLower.replace(/\s+/g, '_')
    })
    
    if (matchedCategory && matchedCategory !== 'All') {
      console.log('Matched category:', matchedCategory)
      // Convert display format to type format for filter matching
      const categoryType = formatCategoryType(matchedCategory)
      setFilter('category', categoryType)
      setSearchQuery('')
    } else {
      // Treat as location search
      console.log('Treating as location search')
      const query = searchQuery
      setSearchQuery('') // Clear search before location search
      handleLocationSearch(query)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      handleSearch()
    }
  }

  return (
    <div className="bg-white sticky top-0 z-30 shadow-sm">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <button
            onClick={onLogoClick}
            className="flex items-center gap-2 flex-shrink-0"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">
              Saga Health
            </h1>
          </button>

          {/* Search Bar - Only show on marketplace page */}
          {!hideSearch && (
            <div className="flex-1 max-w-4xl relative">
              <input
                type="text"
                placeholder={isMobile ? "Search" : "Search services (e.g., Massage, Yoga) or location (e.g., New York, 10001)..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoadingLocation}
                className="w-full px-4 py-2.5 pr-32 rounded-xl text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
              
              {/* Active Filters Display and Search Icon */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {filters.category !== 'all' && (
                  <div className="flex items-center gap-1 bg-emerald-100 px-2 py-1 rounded-lg">
                    <span className="text-xs text-emerald-800">{filters.category}</span>
                    <button
                      onClick={() => setFilter('category', 'all')}
                      className="text-emerald-600 hover:text-emerald-800 font-bold text-xs"
                    >
                      ✕
                    </button>
                  </div>
                )}
                {userLocation && (
                  <div className="flex items-center gap-1 bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200">
                    <span className="text-xs text-blue-800 font-medium">
                      📍 {userLocation.address.split(',').slice(0, 2).join(', ') || 'Your Location'}
                    </span>
                  </div>
                )}
                {/* Search Icon Button */}
                <button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || isLoadingLocation}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Search"
                >
                  <svg 
                    className="w-5 h-5 text-gray-600" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                    />
                  </svg>
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
