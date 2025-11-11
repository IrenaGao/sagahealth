import { useNavigate } from 'react-router-dom';

// Helper function to convert business name to URL-friendly format
const toUrlFriendly = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_') // Replace non-alphanumeric with underscore
    .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
};

export default function ListingCard({ listing, isHighlighted, onClick }) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    // Call the onClick for map highlighting
    if (onClick) {
      onClick();
    }
    // Navigate to service details page using business name
    const urlFriendlyName = toUrlFriendly(listing.name || listing.business_name || `service-${listing.id}`);
    navigate(`/service/${urlFriendlyName}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 flex flex-col sm:flex-row sm:h-48 ${
        isHighlighted ? 'ring-2 ring-emerald-500 shadow-lg' : 'shadow-md'
      }`}
    >
      {/* Image - Left side on desktop, top on mobile */}
      {listing.image && (
        <div className="relative w-full sm:w-1/4 h-48 flex-shrink-0">
          <img
            src={listing.image}
            alt={listing.name}
            className="object-cover w-full h-full"
          />
        </div>
      )}
      
      {/* Text Content - Right side on desktop, bottom on mobile */}
      <div className="px-2 py-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-lg text-gray-900 leading-tight">
              {listing.name}
            </h3>
            {listing.categories && listing.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 justify-end">
                {listing.categories.map((category, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-lg whitespace-nowrap"
                  >
                    {category}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {/* Rating, Reviews, and Location on one line */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {listing.rating && (
              <div className="flex items-center">
                <span className="text-yellow-400 text-sm">★</span>
                <span className="ml-1 text-sm font-medium text-gray-900">
                  {listing.rating.toFixed(1)}
                </span>
              </div>
            )}
            {listing.reviewCount > 0 && (
              <span className="text-sm text-gray-500">
                ({listing.reviewCount} {listing.reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            )}
            {(listing.rating || listing.reviewCount > 0) && listing.address && (
              <span className="text-gray-400 text-sm">•</span>
            )}
            {listing.address && (
              <span className="text-sm text-gray-500">
                {listing.address}
              </span>
            )}
          </div>
          
          {listing.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {listing.description}
            </p>
          )}
        </div>
        
        <div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const urlFriendlyName = toUrlFriendly(listing.name || listing.business_name || `service-${listing.id}`);
              navigate(`/book/${urlFriendlyName}`);
            }}
            className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700 mb-2"
          >
            📅 Book Now →
          </button>
        </div>
      </div>
    </div>
  );
}

