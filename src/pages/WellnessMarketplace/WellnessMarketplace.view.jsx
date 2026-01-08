import ListingCard from "../../components/ListingCard";
import WellnessMap from "../../components/WellnessMap";
import SearchBar from "../../components/SearchBar";
import Loader from "../../components/Loader";
import Navbar from "../../components/Navbar/Navbar.controller.jsx";
import Filters from "../../components/Filters/Filters.controller.jsx";

export default function WellnessMarketplaceView({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedBookableFilter,
  onBookableFilterChange,
  loading,
  error,
  radiusMiles,
  onRadiusChange,
  filteredListings,
  paginatedListings,
  totalPages,
  currentPage,
  onPageChange,
  listRefs,
  highlightedId,
  onCardClick,
  onMarkerClick,
  onRetry,
  onNavigateToLMN,
  itemsPerPage,
  userLocation,
  onLocationSelect,
  onClearLocation,
}) {
  console.log("paginatedListings:", paginatedListings);
  return (
    <div className="h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 overflow-hidden">
      {/* Navbar */}
      <Navbar 
        onLogoClick={() => window.location.reload()}
        rightContent={
          <button
            className="px-6 py-2 bg-emerald-500 text-white font-medium rounded-xl shadow-md hover:bg-emerald-600 transition-colors"
            onClick={() => window.open('https://mysagahealth.com', '_blank')}
          >
            Learn More
          </button>
        }
      />

      {/* Search Bar */}
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
        selectedBookableFilter={selectedBookableFilter}
        onBookableFilterChange={onBookableFilterChange}
        userLocation={userLocation}
        onLocationSelect={onLocationSelect}
        onClearLocation={onClearLocation}
      />

      {/* Filters */}
      {/* <Filters
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
        selectedBookableFilter={selectedBookableFilter}
        onBookableFilterChange={onBookableFilterChange}
        selectedRadius={radiusMiles}
        onRadiusChange={onRadiusChange}
        hasLocation={!!userLocation}
      /> */}

      {/* LMN Button Banner */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 border-b border-emerald-600">
        <div className="max-w-[1920px] mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-3">
          <button
            onClick={onNavigateToLMN}
            className="w-full text-center text-white font-medium hover:underline transition-colors"
          >
            <span className="mr-1">🔍</span> Save 30% on your appointment for a
            service provider of your choice! ✨
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 h-[calc(100vh-146px)]">
        <div className="flex flex-col lg:flex-row h-full -mx-2 sm:-mx-3 md:-mx-4 lg:-mx-6 xl:-mx-8">
          {/* Listings Column */}
          <div className="w-full lg:w-1/2 h-full overflow-y-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-6">
            {loading ? (
              <Loader
                text="Loading wellness providers..."
                color="emerald"
                size="md"
              />
            ) : error ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Connection Error
                </h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={onRetry}
                  className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium shadow-md hover:bg-emerald-600 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No results found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <div className="space-y-4 pb-6">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex flex-col gap-1">
                    <span>
                      {userLocation && "📍 "}
                      Showing{" "}
                      {Math.min(
                        (currentPage - 1) * itemsPerPage + 1,
                        filteredListings.length
                      )}
                      -
                      {Math.min(
                        currentPage * itemsPerPage,
                        filteredListings.length
                      )}{" "}
                      of {filteredListings.length}{" "}
                      {filteredListings.length === 1 ? "result" : "results"}
                      {userLocation && ` within ${radiusMiles} miles of:`}
                    </span>
                    {userLocation && (
                      <span className="text-emerald-600 font-medium">
                        {userLocation.address}
                      </span>
                    )}
                  </div>
                </div>
                {paginatedListings.map((listing) => (
                  <div
                    key={listing.id}
                    ref={(el) => {
                      listRefs.current[listing.id] = el;
                    }}
                  >
                    <ListingCard
                      listing={listing}
                      isHighlighted={highlightedId === listing.id}
                      onClick={() => onCardClick(listing.id)}
                    />
                  </div>
                ))}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 pt-4 pb-8 sm:pb-4">
                    <button
                      onClick={() =>
                        onPageChange((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-lg border ${
                        currentPage === 1
                          ? "text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed"
                          : "text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={() =>
                        onPageChange((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 rounded-lg border ${
                        currentPage === totalPages
                          ? "text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed"
                          : "text-gray-700 border-gray-300 hover:bg-gray-50"
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
          <div className="hidden lg:block lg:w-3/5 h-full lg:px-0">
            <div className="h-full w-full">
              <WellnessMap
                listings={filteredListings}
                highlightedId={highlightedId}
                onMarkerClick={onMarkerClick}
                userLocation={userLocation}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
