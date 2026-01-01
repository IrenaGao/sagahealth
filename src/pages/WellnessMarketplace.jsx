import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ListingCard from '../components/ListingCard'
import WellnessMap from '../components/WellnessMap'
import SearchBar from '../components/SearchBar'
import { supabase } from '../supabaseClient'

export default function WellnessMarketplace() {
  const navigate = useNavigate()
  const [providers, setProviders] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedBookableFilter, setSelectedBookableFilter] = useState('All')
  const [highlightedId, setHighlightedId] = useState(undefined)
  const [showMap, setShowMap] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const listRefs = useRef({})
  const ITEMS_PER_PAGE = 6

  // Fetch providers from Supabase
  useEffect(() => {
    fetchProviders()
  }, [])

  // Geocode address to coordinates
  const geocodeAddress = async (address) => {
    if (!address) return { lat: 40.7484, lng: -73.9857 } // Default NYC center
    
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      if (!apiKey) return { lat: 40.7484, lng: -73.9857 }
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
      )
      const data = await response.json()
      
      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location
        return { lat: location.lat, lng: location.lng }
      }
    } catch (err) {
      console.error('Geocoding error for address:', address, err)
    }
    
    return { lat: 40.7484, lng: -73.9857 } // Fallback to default
  }

  const fetchProviders = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .order('id', { ascending: true })
      
      console.log("Raw data from Supabase:", data)
      
      if (error) {
        setError(`Error: ${error.message}`)
        console.error('Error fetching providers:', error)
      } else {
        // Map database fields to frontend expectations and geocode addresses
        const mappedDataPromises = (data || []).map(async (provider) => {
          const coordinates = await geocodeAddress(provider.address)
          
          // Handle business_type as array or single value
          let categories = []
          if (Array.isArray(provider.business_type)) {
            categories = provider.business_type
          } else if (provider.business_type) {
            categories = [provider.business_type]
          } else {
            categories = ['Other']
          }
          
          return {
            id: provider.id,
            order: provider.order ?? null,
            name: provider.business_name || 'Unnamed Business',
            categories: categories, // Now an array
            description: provider.short_summary || '',
            bookingLink: provider.booking_link || '',
            rating: provider.rating || null,
            reviewCount: provider.num_reviews || 0,
            address: provider.address || '',
            // Use provider image or default fallback
            image: provider.image || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=450&fit=crop',
            neighborhood: '',
            city: '',
            coordinates: coordinates,
            bookingSystemEnabled: provider.booking_system !== false,
            stripeAcctId: provider.stripe_acct_id || null,
          }
        })
        
        const mappedData = await Promise.all(mappedDataPromises)
        
        // Sort by order first (nulls last), then by id
        mappedData.sort((a, b) => {
          // If both have order values, sort by order
          if (a.order !== null && b.order !== null) {
            if (a.order !== b.order) {
              return a.order - b.order
            }
          }
          // If only one has order, prioritize it
          if (a.order !== null && b.order === null) {
            return -1
          }
          if (a.order === null && b.order !== null) {
            return 1
          }
          // If both are null or same order, sort by id
          return a.id - b.id
        })
        
        console.log("Mapped data with coordinates:", mappedData)
        setProviders(mappedData)
        setError(null)
      }
    } catch (err) {
      setError(`Failed to fetch: ${err.message}`)
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter listings based on search and category
  const filteredListings = useMemo(() => {
    console.log('Filtering providers:', providers.length, 'providers')
    console.log('Search query:', searchQuery)
    console.log('Selected category:', selectedCategory)
    
    return providers.filter((provider) => {
      // If search query is empty, match all
      const matchesSearch = searchQuery === '' || 
        provider.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.categories?.some(cat => cat.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCategory = selectedCategory === 'All' || 
        provider.categories?.some(cat => cat.toLowerCase() === selectedCategory.toLowerCase())

      const matchesBookableFilter = selectedBookableFilter === 'All' ||
        (selectedBookableFilter === 'Bookable' && provider.bookingSystemEnabled !== false) ||
        (selectedBookableFilter === 'LMN Only' && provider.bookingSystemEnabled === false)

      console.log('Provider:', provider.name, 'matchesSearch:', matchesSearch, 'matchesCategory:', matchesCategory, 'matchesBookableFilter:', matchesBookableFilter, 'categories:', provider.categories)
      
      return matchesSearch && matchesCategory && matchesBookableFilter
    })
  }, [providers, searchQuery, selectedCategory, selectedBookableFilter])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, selectedBookableFilter, providers.length])

  const totalPages = Math.max(1, Math.ceil(filteredListings.length / ITEMS_PER_PAGE))
  const paginatedListings = filteredListings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Handle card click - highlight and scroll to on map
  const handleCardClick = (id) => {
    setHighlightedId(id)
  }

  // Handle marker click - highlight and scroll to card
  const handleMarkerClick = (id) => {
    setHighlightedId(id)
    
    // Scroll to the card
    const element = listRefs.current[id]
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <div className="h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 overflow-hidden">
      {/* Search Bar */}
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedBookableFilter={selectedBookableFilter}
        onBookableFilterChange={setSelectedBookableFilter}
      />

      {/* LMN Button Banner */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 border-b border-emerald-600">
        <div className="max-w-[1920px] mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-3">
          <button
            onClick={() => navigate('/book/any-provider/lmn-form', { state: { bookingSystemEnabled: false } })}
            className="w-full text-center text-white font-medium hover:underline transition-colors"
          >
            <span className="mr-1">🔍</span>  Don't see your provider listed? Click here to get an LMN for any provider of your choice! ✨
          </button>
        </div>
        </div>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 h-[calc(100vh-232px)]">
        <div className="flex flex-col lg:flex-row h-full -mx-2 sm:-mx-3 md:-mx-4 lg:-mx-6 xl:-mx-8">
          {/* Listings Column */}
          <div className="w-full lg:w-3/5 h-full overflow-y-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-6">
            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
                <p className="text-gray-600">Loading wellness providers...</p>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={fetchProviders}
                  className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium shadow-md hover:bg-emerald-600 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="space-y-4 pb-6">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <span>
                    Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredListings.length)}-
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredListings.length)} of {filteredListings.length}{' '}
                    {filteredListings.length === 1 ? 'result' : 'results'}
                  </span>
                  {totalPages > 1 && (
                    <span>
                      Page {currentPage} of {totalPages}
                    </span>
                  )}
                </div>
                {paginatedListings.map((listing) => (
                  <div
                    key={listing.id}
                    ref={(el) => {
                      listRefs.current[listing.id] = el
                    }}
                  >
                    <ListingCard
                      listing={listing}
                      isHighlighted={highlightedId === listing.id}
                      onClick={() => handleCardClick(listing.id)}
                    />
                  </div>
                ))}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 pt-4 pb-8 sm:pb-4">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-lg border ${
                        currentPage === 1
                          ? 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed'
                          : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 rounded-lg border ${
                        currentPage === totalPages
                          ? 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed'
                          : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Map Column - Desktop only */}
          <div className="hidden lg:block lg:w-2/5 h-full lg:px-0">
            <div className="h-full w-full">
              <WellnessMap
                listings={filteredListings}
                highlightedId={highlightedId}
                onMarkerClick={handleMarkerClick}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

