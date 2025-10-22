import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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

export default function EmbeddedBooking() {
  const { businessName } = useParams(); // service business name
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const bookingOptionId = parseInt(searchParams.get('bookingOption'));
  
  const [service, setService] = useState(null);
  const [bookingOptions, setBookingOptions] = useState([]);
  const [bookingOption, setBookingOption] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const iframeRef = useRef(null);

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
        address: providerData.address || '',
        rating: providerData.rating || null,
        reviewCount: providerData.num_reviews || 0,
      });

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
          url: service.booking_link || '',
          icon: getServiceIcon(service.service_type),
          price: service.service_pricing || null,
        }));
        
        setBookingOptions(options);
        
        // Find the selected booking option
        if (bookingOptionId) {
          const selected = options.find(opt => opt.id === bookingOptionId);
          setBookingOption(selected);
        }
      }
    } catch (err) {
      setError(`Failed to fetch: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Callback function when booking is detected
  const onBookingComplete = () => {
    console.log('Booking completed!');
    
    // Navigate to LMN form with service type
    const serviceType = bookingOption?.serviceType || 'Wellness service';
    navigate(`/book/${businessName}/lmn-form?service=${encodeURIComponent(serviceType)}`);
    
    return true;
  };

  // Listen for messages from the iframe (Google Calendar)
  useEffect(() => {
    const handleMessage = (event) => {
      // Security: Only accept messages from Google Calendar domain
      if (event.origin !== 'https://calendar.google.com') {
        return;
      }
      
      console.log('Message received from calendar:', event.data);
      
      // Check if the message indicates a booking completion
      // Note: Google Calendar may not send these messages by default
      // This is here for future compatibility or if they add this feature
      if (event.data && typeof event.data === 'object') {
        if (event.data.type === 'booking_complete' || 
            event.data.action === 'appointment_booked' ||
            event.data.status === 'confirmed') {
          onBookingComplete();
        }
      }
    };

    // Add event listener
    window.addEventListener('message', handleMessage);

    // Cleanup
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Monitor iframe load events
  const handleIframeLoad = () => {
    console.log('Calendar iframe loaded');
    
    // Try to detect if the URL changed (limited by CORS)
    try {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        // This will likely fail due to CORS, but we try anyway
        const iframeUrl = iframeRef.current.contentWindow.location.href;
        console.log('Iframe URL:', iframeUrl);
        
        // If the URL contains a confirmation parameter, consider it a success
        if (iframeUrl.includes('confirmed') || iframeUrl.includes('success')) {
          onBookingComplete();
        }
      }
    } catch (e) {
      // Expected to fail due to CORS - this is normal
      console.log('Cannot access iframe URL (CORS protected)');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading booking...</div>
      </div>
    );
  }

  if (error || !service || !bookingOption) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">{error || 'Booking option not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 hidden sm:block">Saga Health</h1>
            </button>
            
            <button
              onClick={() => navigate(`/book/${businessName}`)}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Services
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Important Reminder */}
        <div className="mb-6 bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
          <div className="flex items-start">
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">
                ⚠️ <span className="ml-1">Important: Your appointment is NOT confirmed until you click "Get your LMN now" at the bottom of this page</span>
              </p>
            </div>
          </div>
        </div>

        {/* Service Info */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{service.name}</h1>
          <div className="flex items-center gap-4 text-gray-600">
            <span className="text-2xl">{bookingOption.icon}</span>
            <span className="text-lg font-medium">{bookingOption.name}</span>
            {bookingOption.price && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-emerald-600 font-semibold">${bookingOption.price}</span>
              </>
            )}
          </div>
        </div>

        {/* Embedded Calendar */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <iframe
            ref={iframeRef}
            src={bookingOption.url}
            className="w-full h-[800px] border-0"
            title={`Book ${bookingOption.name}`}
            onLoad={handleIframeLoad}
          />
        </div>

        {/* Manual Confirmation (Workaround for CORS) */}
        <div className="mt-6 bg-gradient-to-br from-emerald-50 to-blue-50 border-2 border-emerald-200 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900 mb-1">
                Ready to use your HSA funds?
              </h3>
              <p className="text-sm text-gray-700">
                Save ~30% on your appointment by unlocking pre-tax HSA/FSA funds. Just take a
                quick health survey, pay a $20 fee, and get your Letter of Medical Necessity (LMN)
                in hours.
              </p>
            </div>
            <button
              onClick={onBookingComplete}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Get your LMN now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

