import { useState } from 'react'

export default function LocationSearch({ onLocationSelect, userLocation, onClear }) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async () => {
    if (!input.trim()) return

    setIsLoading(true)
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      if (!apiKey) {
        alert('Google Maps API key not configured')
        return
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(input)}&key=${apiKey}`
      )
      const data = await response.json()

      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location
        const formattedAddress = data.results[0].formatted_address
        onLocationSelect({
          lat: location.lat,
          lng: location.lng,
          address: formattedAddress
        })
        setInput('')
      } else {
        alert('Location not found. Please try a different address.')
      }
    } catch (error) {
      console.error('Error geocoding location:', error)
      alert('Error finding location. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-[1920px] mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-4">
        {userLocation ? (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">📍 Location filter active:</span>
              <span className="font-medium text-gray-900">{userLocation.address}</span>
            </div>
            <button
              onClick={onClear}
              className="px-4 py-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium hover:bg-emerald-50 rounded-lg transition-colors"
            >
              Clear Location
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your location (e.g., New York, NY or ZIP code)"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isLoading || !input.trim()}
              className="px-6 py-2.5 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {isLoading ? 'Searching...' : 'Find Nearby'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
