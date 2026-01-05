import { useState, useEffect } from 'react'

const categories = ['All', 'Gym', 'Massage', 'Yoga'];

export default function SearchBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedBookableFilter,
  onBookableFilterChange,
  userLocation,
  onLocationSelect,
  onClearLocation,
}) {
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Generate suggestions based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const query = searchQuery.toLowerCase()
    const matchedCategories = categories.filter(cat => 
      cat.toLowerCase().includes(query) && cat !== 'All'
    )

    if (matchedCategories.length > 0) {
      setSuggestions([
        ...matchedCategories.map(cat => ({ type: 'category', value: cat })),
        { type: 'location', value: searchQuery }
      ])
      setShowSuggestions(true)
    } else {
      setSuggestions([{ type: 'location', value: searchQuery }])
      setShowSuggestions(true)
    }
  }, [searchQuery])

  const handleSelectSuggestion = async (suggestion) => {
    console.log('Selected suggestion:', suggestion)
    if (suggestion.type === 'category') {
      onCategoryChange(suggestion.value)
      onSearchChange('')
      setShowSuggestions(false)
    } else if (suggestion.type === 'location') {
      onSearchChange('') // Clear search first
      await handleLocationSearch(suggestion.value)
      setShowSuggestions(false)
    }
  }

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

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationQuery)}&key=${apiKey}`
      )
      const data = await response.json()

      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location
        const formattedAddress = data.results[0].formatted_address
        const locationData = {
          lat: location.lat,
          lng: location.lng,
          address: formattedAddress
        }
        console.log('Location found, calling onLocationSelect:', locationData)
        onLocationSelect(locationData)
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
    
    // Check if it matches a category first
    const matchedCategory = categories.find(cat => 
      cat.toLowerCase() === searchQuery.toLowerCase()
    )
    
    if (matchedCategory && matchedCategory !== 'All') {
      console.log('Matched category:', matchedCategory)
      onCategoryChange(matchedCategory)
      onSearchChange('')
      setShowSuggestions(false)
    } else {
      // Treat as location search
      console.log('Treating as location search')
      const query = searchQuery
      onSearchChange('') // Clear search before location search
      handleLocationSearch(query)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      handleSearch()
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-[1920px] mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 pt-6 pb-4">
        {/* Logo and Search Input Row */}
        <div className="flex items-center gap-6 md:gap-8 mb-4">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">Saga Health</h1>
          </div>
          
          {/* Search Input */}
          <div className="flex-1 flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search services (e.g., Massage, Yoga) or location (e.g., New York, 10001)..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => searchQuery && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                disabled={isLoadingLocation}
                className="w-full px-4 py-3 pr-32 rounded-xl text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
              
              {/* Suggestions Dropdown */}
              {/* {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="w-full px-4 py-3 text-left hover:bg-emerald-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                    >
                      {suggestion.type === 'category' ? (
                        <>
                          <span className="text-emerald-500">🏷️</span>
                          <div>
                            <div className="font-medium text-gray-900">{suggestion.value}</div>
                            <div className="text-xs text-gray-500">Category</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-blue-500">📍</span>
                          <div>
                            <div className="font-medium text-gray-900">Search for "{suggestion.value}"</div>
                            <div className="text-xs text-gray-500">Set as location</div>
                          </div>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              )} */}
              
              {/* Active Filters Display and Search Icon */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {selectedCategory !== 'All' && (
                  <div className="flex items-center gap-1 bg-emerald-100 px-2 py-1 rounded-lg">
                    <span className="text-xs text-emerald-800">{selectedCategory}</span>
                    <button
                      onClick={() => onCategoryChange('All')}
                      className="text-emerald-600 hover:text-emerald-800 font-bold text-xs"
                    >
                      ✕
                    </button>
                  </div>
                )}
                {userLocation && (
                  <div className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded-lg">
                    <span className="text-xs text-blue-800">📍 {userLocation.address.split(',')[0]}</span>
                    <button
                      onClick={onClearLocation}
                      className="text-blue-600 hover:text-blue-800 font-bold text-xs"
                    >
                      ✕
                    </button>
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
          </div>

          {/* Link to Main Site */}
          <a
            href="https://mysagahealth.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            Learn More
          </a>
        </div>
        
        {/* Category Chips - Aligned with search bar */}
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar ml-[56px] sm:ml-[174px] md:ml-[186px]">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

