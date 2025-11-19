import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Helper function to convert URL-friendly name back to potential business name matches
const fromUrlFriendly = (urlName) => {
  return urlName.replace(/_/g, ' ');
};

// Helper function to format duration
const formatDuration = (minutes) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return `${hours}h ${mins}min`;
};

// Helper function to get icon based on service type
const getServiceIcon = (serviceType) => {
  const type = serviceType?.toLowerCase() || '';
  if (type.includes('massage') || type.includes('spa')) return '💆';
  if (type.includes('training') || type.includes('fitness') || type.includes('gym')) return '💪';
  if (type.includes('yoga') || type.includes('meditation')) return '🧘';
  if (type.includes('nutrition') || type.includes('diet')) return '🥗';
  if (type.includes('therapy') || type.includes('counseling')) return '💬';
  return '✨'; // default icon
};

export default function BookingPage() {
  const { businessName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const stripeAcctIdFromState = location.state?.stripeAcctId;
  
  const [service, setService] = useState(null);
  const [bookingOptions, setBookingOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stripeAcctId, setStripeAcctId] = useState(stripeAcctIdFromState || null);

  // Fetch service details
  useEffect(() => {
    fetchServiceDetails();
  }, [businessName]);

  const fetchServiceDetails = async () => {
    try {
      setLoading(true);
      
      // Convert URL-friendly name back to search pattern
      const searchPattern = fromUrlFriendly(businessName);
      
      // Fetch provider details
      const { data: providerData, error: providerError } = await supabase
        .from('providers')
        .select('*')
        .ilike('business_name', searchPattern)
        .single();

      if (providerError) {
        setError(`Error: ${providerError.message}`);
        return;
      }

      let categories = [];
      if (Array.isArray(providerData.business_type)) {
        categories = providerData.business_type;
      } else if (providerData.business_type) {
        categories = [providerData.business_type];
      }

      setService({
        id: providerData.id,
        name: providerData.business_name || 'Wellness Service',
        categories: categories,
        description: providerData.short_summary || '',
        complete: providerData.complete !== false, // Default to true if not specified
        address: providerData.address || '',
        rating: providerData.rating || null,
        reviewCount: providerData.num_reviews || 0,
      });
      
      // Set stripe_acct_id from providerData if not already set from navigation state
      if (!stripeAcctId && providerData.stripe_acct_id) {
        setStripeAcctId(providerData.stripe_acct_id);
      }

      // Fetch booking options for this provider
      const { data: servicesData, error: servicesError } = await supabase
        .from('provider_services')
        .select('*')
        .eq('business_id', providerData.id);

      if (servicesError) {
        console.error('Error fetching services:', servicesError);
        setBookingOptions([]);
      } else {
        // Transform services data to match expected format
        const options = servicesData.map((service, index) => ({
          id: index + 1, // Use index as ID for URL params
          serviceId: service.id, // Store actual service ID
          name: service.service_type || 'Service',
          serviceType: service.service_type, // Store service type for LMN form
          duration: formatDuration(service.duration_in_mins || 60),
          durationInMins: service.duration_in_mins || 60, // Store raw minutes for sorting
          description: `${service.service_type} session`,
          url: service.booking_link || '',
          icon: getServiceIcon(service.service_type),
          price: service.service_pricing || null,
        }));
        
        // Sort by duration (shortest to longest)
        const sortedOptions = options.sort((a, b) => a.durationInMins - b.durationInMins);
        
        setBookingOptions(sortedOptions);
      }
    } catch (err) {
      setError(`Failed to fetch: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Service Not Found</h3>
          <p className="text-gray-600 mb-4">{error || 'This service could not be loaded.'}</p>
          <button
            onClick={() => navigate('/')}
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
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 hidden sm:block">Saga Health</h1>
            </button>
            
            {/* Back Button */}
            <button
              onClick={() => navigate(`/service/${businessName}`)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back to Service Details</span>
            </button>
          </div>
        </div>
      </div>

      {/* Booking Content */}
      <div className="max-w-7xl mx-auto px-8 sm:px-16 lg:px-24 xl:px-32 2xl:px-40 py-8">
        {/* Service Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{service.name}</h1>
          <div className="flex flex-wrap gap-2 mb-3">
            {service.categories.map((category, index) => (
              <span key={index} className="px-3 py-1 text-sm font-medium bg-emerald-50 text-emerald-700 rounded-lg">
                {category}
              </span>
            ))}
          </div>
          {service.address && (
            <p className="text-gray-600 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {service.address}
            </p>
          )}
        </div>

        {/* Booking Options */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {!service.complete ? (
            // Coming Soon Message
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🚧</div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Coming Soon</h2>
              <p className="text-gray-600 text-lg mb-8">
                This provider is currently setting up their booking system. Check back soon!
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors"
              >
                Back to Marketplace
              </button>
            </div>
          ) : (
            <>
              <div className="mb-12">
                <h2 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3 mb-2">
                  <span className="text-3xl">📅</span>
                  Select Your Service
                </h2>
                <p className="text-gray-600 text-base">
                  Choose a service to view available appointment times
                </p>
              </div>

          {/* Massage Therapy Section */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="text-2xl">💆</span>
              Massage Therapy
            </h3>
            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                Personalized treatment to address areas of restriction and optimization of mobility.
              </p>
              <p className="text-sm text-gray-600 italic">
                Myoskeletal Alignment, Graston Technique, Functional Mobility, Deep Tissue, TMJ Release, Prenatal/Postpartum Massage
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {bookingOptions.filter(option => option.icon === '💆').map((option) => (
                <div
                  key={option.id}
                  onClick={() => navigate(`/book/${businessName}/schedule?bookingOption=${option.id}`, {
                    state: { stripeAcctId: stripeAcctId }
                  })}
                  className="group relative bg-gradient-to-br from-emerald-50 to-white border-2 border-gray-200 rounded-xl p-6 hover:border-emerald-500 hover:shadow-lg transition-all duration-200 cursor-pointer"
                >
                  {/* Service Duration and Price */}
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                      {option.duration}
                    </h4>
                    
                    {/* Price Tag */}
                    {option.price && (
                      <span className="inline-block px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium rounded-lg ml-2 flex-shrink-0">
                        ${option.price}
                      </span>
                    )}
                  </div>
                  
                  {/* Book Now Button */}
                  <div className="flex items-center gap-2 text-emerald-600 font-medium group-hover:text-emerald-700">
                    <span>Book Now</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Personal Training Section */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="text-2xl">💪</span>
              Personal Training
            </h3>
            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                1-1 and Couples training sessions to achieve individual goals and improve quality of life.
              </p>
              <p className="text-sm text-gray-600 italic">
                Powerlifting Technique, Weight Loss, Sport Performance, Injury Prevention, Functional Mobility, Nutrition Coaching
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {bookingOptions.filter(option => option.icon === '💪').map((option) => (
                <div
                  key={option.id}
                  onClick={() => navigate(`/book/${businessName}/schedule?bookingOption=${option.id}`, {
                    state: { stripeAcctId: stripeAcctId }
                  })}
                  className="group relative bg-gradient-to-br from-emerald-50 to-white border-2 border-gray-200 rounded-xl p-6 hover:border-emerald-500 hover:shadow-lg transition-all duration-200 cursor-pointer"
                >
                  {/* Service Duration and Price */}
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                      {option.duration}
                    </h4>
                    
                    {/* Price Tag */}
                    {option.price && (
                      <span className="inline-block px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium rounded-lg ml-2 flex-shrink-0">
                        ${option.price}
                      </span>
                    )}
                  </div>
                  
                  {/* Book Now Button */}
                  <div className="flex items-center gap-2 text-emerald-600 font-medium group-hover:text-emerald-700">
                    <span>Book Now</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
            </>
          )}
        </div>

        {/* Help Text */}
        {service.complete && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">How It Works</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Click on a service card to view the booking calendar</li>
                <li>• Select your preferred date and time</li>
                <li>• Fill in your contact information</li>
                <li>• You'll receive a confirmation email with appointment details</li>
                <li>• The appointment will be added to your Google Calendar automatically</li>
              </ul>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
