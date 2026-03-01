import { useNavigate, useLocation } from "react-router-dom";
import ListingCard from "../../components/ListingCard";
import WellnessMap from "../../components/WellnessMap";
import SearchBar from "../../components/SearchBar";
import Loader from "../../components/Loader";
import Navbar from "../../components/Navbar/Navbar.controller.jsx";
import Filters from "../../components/Filters/Filters.controller.jsx";
import { useFilterStore } from "../../components/Filters/filterStore";

export default function WellnessMarketplaceView({
  loading,
  googlePlacesLoading,
  error,
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
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const navLinkClass = (path) =>
    `text-sm transition-colors ${location.pathname === path ? 'font-[750] text-gray-900' : 'font-medium text-gray-600 hover:text-gray-900'}`;
  // Get filter values from Zustand store for display
  const userLocation = useFilterStore((state) => state.userLocation);

  console.log("paginatedListings:", paginatedListings);
  return (
    <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50 overflow-hidden">
      {/* Navbar */}
      <Navbar
        onLogoClick={() => window.location.reload()}
        rightContent={
          <div className="flex items-center gap-6">
            <button
              className={navLinkClass("/")}
              onClick={() => navigate("/")}
            >
              Marketplace
            </button>
            <button
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              onClick={() => window.open("https://mysagahealth.com", "_blank")}
            >
              Learn More
            </button>
            <button
              className={navLinkClass("/new-provider")}
              onClick={() => navigate("/new-provider")}
            >
              New Provider?
            </button>
            <button
              className={navLinkClass("/disclosures")}
              onClick={() => navigate("/disclosures")}
            >
              Disclosures
            </button>
          </div>
        }
      />

      {/* Search Bar */}
      <SearchBar />

      {/* Filters */}
      <Filters />

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
          <div className="w-full lg:w-[55%] h-full overflow-y-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-6">
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
            ) : googlePlacesLoading ? (
              <div className="text-center py-20">
                <Loader
                  text="Finding nearby wellness providers..."
                  color="emerald"
                  size="md"
                />
                {filteredListings.length > 0 && (
                  <p className="text-sm text-gray-500 mt-4">
                    Showing {filteredListings.length} providers so far...
                  </p>
                )}
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">{userLocation ? '🔍' : '📍'}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {userLocation ? 'No results found' : 'Set your location to find providers'}
                </h3>
                <p className="text-gray-600">
                  {userLocation
                    ? 'Try adjusting your search or filters'
                    : 'Search for a city or allow location access to discover wellness providers near you'
                  }
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
                      {userLocation && ` within 50 miles of:`}
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
          <div className="hidden lg:block lg:w-[45%] h-full lg:px-0">
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
