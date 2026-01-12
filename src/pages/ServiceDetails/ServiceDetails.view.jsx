import Accordion from "../../components/Accordion/Accordion.controller.jsx";
import Button from "../../components/Button/Button.controller.jsx";
import Navbar from "../../components/Navbar/Navbar.controller.jsx";
import { capitalizeWords } from "../../utils/stringUtils";

export default function ServiceDetailsView({
  service,
  loading,
  error,
  navigate,
  businessSlug,
  onBookingClick,
  faqs,
}) {
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
          <p className="text-gray-600">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Service Not Found
          </h3>
          <p className="text-gray-600 mb-4">
            {error || "This service could not be loaded."}
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium shadow-md hover:bg-emerald-600 transition-colors"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
      {/* Header with Logo and Back Button */}
      <Navbar 
        onLogoClick={() => navigate("/")}
        onBackClick={() => navigate("/")}
      />

      {/* Service Details Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Image */}
        <div className="relative w-full h-[400px] rounded-2xl overflow-hidden mb-8 shadow-lg">
          <img
            src={service.image}
            alt={service.name}
            className="w-full h-full object-cover"
          />
          {service.categories && service.categories.length > 0 && (
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              {service.categories.map((category, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-xl shadow-md"
                >
                  {capitalizeWords(category)}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Service Info Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Name, Rating and Booking Button */}
          <div className="mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                {service.name}
              </h1>

              {service.rating && (
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500 text-xl">★</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {service.rating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">
                    {service.reviewCount}{" "}
                    {service.reviewCount === 1 ? "review" : "reviews"}
                  </span>
                </div>
              )}

              {service.address && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-emerald-500 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <p className="text-gray-600">{service.address}</p>
                  </div>
                </div>
              )}
            </div>
            {/* Desktop Booking Button */}
            <div className="hidden md:block flex-shrink-0">
              <Button
                onClick={onBookingClick}
                className="px-8 py-4 bg-emerald-500 text-white text-lg font-semibold rounded-xl shadow-lg hover:bg-emerald-600 transition-all hover:shadow-xl whitespace-nowrap"
              >
                {service.bookingSystemEnabled === false
                  ? "Get your LMN now"
                  : "Book Now"}
              </Button>
            </div>
          </div>

          {/* Description */}
          {service.description && (
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                About
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {service.description}
              </p>
            </div>
          )}

          {/* FAQs */}
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Accordion
                key={faq.id}
                title={faq.title}
                subtitle={faq.subtitle}
                defaultOpen={index === 0}
              >
                <div className="text-gray-700">{faq.content}</div>
              </Accordion>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Booking Button */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-20">
        <Button
          onClick={onBookingClick}
          className="w-full px-8 py-4 bg-emerald-500 text-white text-lg font-semibold rounded-xl shadow-lg hover:bg-emerald-600 transition-all hover:shadow-xl"
        >
          {service.bookingSystemEnabled === false
            ? "Get your LMN now"
            : "Book Now"}
        </Button>
      </div>
    </div>
  );
}
