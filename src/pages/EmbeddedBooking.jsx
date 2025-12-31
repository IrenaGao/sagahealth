import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const stripeAcctIdFromState = location.state?.stripeAcctId;
  
  const bookingOptionId = parseInt(searchParams.get('bookingOption'));
  
  const [service, setService] = useState(null);
  const [bookingOptions, setBookingOptions] = useState([]);
  const [bookingOption, setBookingOption] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stripeAcctId, setStripeAcctId] = useState(stripeAcctIdFromState || null);
  const [oneBookingLink, setOneBookingLink] = useState(false);
  const [bookingLink, setBookingLink] = useState(null);
  const [showBookingConfirmed, setShowBookingConfirmed] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    classPackage: ''
  });
  const [classOfferings, setClassOfferings] = useState([]);
  const iframeRef = useRef(null);

  // Debug: Track when bookingLink changes
  useEffect(() => {
    console.log("bookingLink state updated to:", bookingLink);
  }, [bookingLink]);

  // Fetch service details
  useEffect(() => {
    fetchServiceDetails();
    console.log("service details fetched");
    console.log("bookingLink", bookingLink);
    console.log("bookingOption", bookingOption);
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
        takeRate: providerData.take_rate || null,
        isApp: providerData.is_app != null,
        appImageUrl: providerData.is_app || null,
        widgetType: providerData.widget_type || null,
      });
      
      // Set one_booking_link flag
      setOneBookingLink(providerData.one_booking_link === true);
      setBookingLink(providerData.booking_link || null);
      
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
        const options = servicesData.map((service, index) => {
          // Use service_name if available, otherwise fall back to service_type
          // service_name should contain the actual service name like "Massage Therapy"
          // service_type might be a generic category like "Wellness service"
          const serviceName = service.service_name || service.service_type || 'Service';
          console.log('Service data:', { 
            service_name: service.service_name, 
            service_type: service.service_type,
            url: service.booking_link,
            using: serviceName 
          });
          return {
          id: index + 1, // Use index as ID for URL params
          serviceId: service.id, // Store actual service ID
            name: serviceName,
            serviceType: serviceName, // Use the actual service name for LMN form
          duration: formatDuration(service.duration_in_mins || 60),
          url: service.booking_link || '',
          icon: getServiceIcon(service.service_type),
          price: service.service_pricing || null,
          };
        });
        
        setBookingOptions(options);
        
        // Get the booking_link from provider_services for all providers
        if (servicesData && servicesData.length > 0) {
          // Use the first service's booking_link, or you could filter by a specific service
          const linkValue = servicesData[0]?.booking_link || null;
          console.log("Setting bookingLink to:", linkValue);
          setBookingLink(linkValue);
          // Note: bookingLink state won't update immediately - it updates on next render
          // Check the useEffect above to see when it actually updates
        }
        
        // Find the selected booking option
        if (bookingOptionId) {
          const selected = options.find(opt => opt.id === bookingOptionId);
          setBookingOption(selected);
        } else if (options.length === 1) {
          // If there's only one booking option and no bookingOption param, auto-select it
          // This handles the case when one_booking_link is true
          setBookingOption(options[0]);
        }
      }
    } catch (err) {
      setError(`Failed to fetch: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch class offerings when one_booking_link is true and service is available
  useEffect(() => {
    const fetchClassOfferings = async () => {
      if (oneBookingLink && service?.id) {
        try {
          console.log('Fetching class offerings for service_id:', service.id);
          const { data, error } = await supabase
            .from('class_offerings')
            .select('*')
            .eq('service_id', service.id);
          
          if (error) {
            console.error('Error fetching class offerings:', error);
            setClassOfferings([]);
          } else {
            console.log('Class offerings fetched:', data);
            console.log('booking link', bookingLink);
            setClassOfferings(data || []);
          }
        } catch (err) {
          console.error('Error fetching class offerings:', err);
          setClassOfferings([]);
        }
      } else {
        console.log('Not fetching class offerings - oneBookingLink:', oneBookingLink, 'service?.id:', service?.id);
        console.log(bookingOption?.url);
        setClassOfferings([]);
      }
    };

    fetchClassOfferings();
  }, [oneBookingLink, service?.id]);


  // Callback function when booking is detected
  const onBookingComplete = () => {
    console.log('Booking completed!');
    
    // Navigate to LMN form with service type, price, and duration
    const serviceType = bookingOption?.serviceType || bookingOption?.name || 'Wellness service';
    const servicePrice = bookingOption?.price || 80;
    const duration = bookingOption?.duration || '60 min';
    console.log('EmbeddedBooking - Navigating with serviceType:', serviceType);
    console.log('EmbeddedBooking - bookingOption:', bookingOption);
    navigate(`/book/${businessName}/lmn-form?service=${encodeURIComponent(serviceType)}&price=${servicePrice}&duration=${encodeURIComponent(duration)}`, {
      state: { stripeAcctId: stripeAcctId }
    });
    
    return true;
  };

  // Handle App Store badge click - generate UUID and append to URL
  const handleAppStoreClick = (e) => {
    e.preventDefault();
    
    // Generate UUID
    const uuid = crypto.randomUUID();
    
    // Get the booking URL
    const baseUrl = bookingOption?.url || '';
    
    console.log('Base URL before UUID append:', baseUrl);
    
    try {
      // Append UUID as query parameter
      const url = new URL(baseUrl);
      url.searchParams.set('saga_referral_id', uuid);
      const finalUrl = url.toString();
      
      console.log('App Store link clicked with referral UUID:', uuid);
      console.log('Final URL with UUID:', finalUrl);
      
      // Open in new tab
      window.open(finalUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      // If URL is invalid, try appending as query string manually
      console.warn('Invalid URL format, attempting manual append:', error);
      const separator = baseUrl.includes('?') ? '&' : '?';
      const urlWithUuid = `${baseUrl}${separator}saga_referral_id=${uuid}`;
      
      console.log('App Store link clicked with referral UUID:', uuid);
      console.log('Final URL with UUID (manual append):', urlWithUuid);
      
      window.open(urlWithUuid, '_blank', 'noopener,noreferrer');
    }
  };

  // Listen for messages from the iframe (Google Calendar)
  // Check if user canceled checkout
  useEffect(() => {
    if (searchParams.get('canceled') === 'true') {
      alert('Payment was canceled. You can try again when ready.');
    }
  }, [searchParams]);

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
                 ⚠️ <span className="ml-1">
                   {oneBookingLink 
                     ? 'Important: Your purchase is NOT confirmed until you click "Confirm booking" at the bottom of this page'
                     : 'Important: Your purchase is NOT confirmed until you click "Get your LMN now" or "Pay for my appointment" at the bottom of this page'
                   }
                 </span>
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

        {/* Embedded Calendar or App Store Badge */}
        {service?.isApp ? (
          <div className="relative rounded-2xl overflow-hidden" style={{ minHeight: '400px' }}>
            {/* Background image */}
            {service?.appImageUrl && (
              <div 
                className="absolute inset-0 bg-contain bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url(${service.appImageUrl})`,
                  filter: 'blur(1.5px)',
                }}
              />
            )}
            {/* Gray overlay */}
            <div className="absolute inset-0 bg-gray-500 bg-opacity-40" />
            
            {/* Booking confirmation overlay - only show when booking not confirmed and is_app is set */}
            {!bookingConfirmed && service?.isApp && oneBookingLink && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl pt-3 pb-6 px-16">
                  <div className="flex flex-col h-full">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-blue-900 mt-4 mb-3 text-center">
                        Ready to download?
                      </h3>
                      <p className="text-sm text-blue-800 mb-4 flex-1 text-center">
                        Enter your name and email to get started.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (!bookingConfirmed) {
                          setShowBookingConfirmed(true);
                        }
                      }}
                      disabled={bookingConfirmed}
                      className={`px-8 py-3 font-semibold rounded-lg transition-all shadow-md flex items-center justify-center gap-2 ${
                        bookingConfirmed
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white hover:shadow-lg'
                      }`}
                    >
                      {bookingConfirmed ? (
                        <>
                          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Booking Confirmed
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Continue
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* App Store badge centered - only show when booking is confirmed */}
            {bookingConfirmed && (
              <div className="relative flex items-center justify-center h-full min-h-[400px] py-12 z-10">
                <button
                  onClick={handleAppStoreClick}
                  className="inline-block hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-0 p-0 z-10"
                >
                  <img 
                    src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83&releaseDate=1276560000" 
                    alt="Download on the App Store"
                    className="h-20 w-auto"
                  />
                </button>
              </div>
            )}
          </div>
        ) : (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <iframe
            ref={iframeRef}
            {...(service?.widgetType === 'momence' && bookingLink ? {
              srcdoc: bookingOption.url
            } : {
              src: bookingOption.url
            })}
            className="w-full h-[800px] border-0"
            title={`Book ${bookingOption.name}`}
            onLoad={handleIframeLoad}
          />
        </div>
        )}

        {/* Payments Section */}
        <div className={`mt-6 ${oneBookingLink ? '' : 'bg-white rounded-2xl shadow-lg p-6'}`}>
          <div>
            {!oneBookingLink && <h2 className="text-2xl font-bold text-gray-900 mb-6">Payments</h2>}
            
            {oneBookingLink ? (
              <div className={`grid grid-cols-1 ${service?.isApp ? 'lg:grid-cols-1' : 'lg:grid-cols-2'} gap-6`}>
                {/* Done booking - Blue subsection - only show if not is_app */}
                {!service?.isApp && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
                    <div className="flex flex-col h-full">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-blue-900 mt-4 mb-3 text-center">
                          Ready to complete your booking?
                        </h3>
                        <p className="text-sm text-blue-800 mb-4 flex-1 text-center">
                          You'll receive a confirmation email shortly.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (!bookingConfirmed) {
                            setShowBookingConfirmed(true);
                          }
                        }}
                        disabled={bookingConfirmed}
                        className={`px-8 py-3 font-semibold rounded-lg transition-all shadow-md flex items-center justify-center gap-2 ${
                          bookingConfirmed
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white hover:shadow-lg'
                        }`}
                      >
                        {bookingConfirmed ? (
                          <>
                            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Booking Confirmed
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Confirm booking
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Get your LMN now - Green subsection */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
                  <div className={`flex ${service?.isApp ? 'flex-row items-center gap-12' : 'flex-col h-full'}`}>
                    <div className={service?.isApp ? 'flex-none w-3/5' : 'flex-1'}>
                      <h3 className="text-lg font-bold text-green-900 mb-3">
                        First time booking this service? Get your LMN now!
                      </h3>
                      <p className={`text-sm text-green-800 ${service?.isApp ? 'mb-0' : 'mb-4 flex-1'}`}>
                        Save ~30% on your appointment by unlocking pre-tax HSA/FSA funds. Just take a
                        quick health survey, pay a $20 fee, and get your Letter of Medical Necessity (LMN)
                        in hours.
                      </p>
                    </div>
                    <button
                      onClick={onBookingComplete}
                      className={`${service?.isApp ? 'px-12 py-3 flex-1' : 'px-8 py-3'} bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Get your LMN now
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* First time using HSA funds - Green subsection */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
              <div className="flex flex-col h-full">
                    <div className="flex-1">
                <h3 className="text-lg font-bold text-green-900 mb-3">
                        First time booking this service? Get your LMN now!
                </h3>
                <p className="text-sm text-green-800 mb-4 flex-1">
                  Save ~30% on your appointment by unlocking pre-tax HSA/FSA funds. Just take a
                  quick health survey, pay a $20 fee, and get your Letter of Medical Necessity (LMN)
                        in hours. You can also pay for your appointment here!
                </p>
                    </div>
                <button
                  onClick={onBookingComplete}
                      className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Get your LMN now
                </button>
              </div>
            </div>

            {/* Already have an LMN - Blue subsection */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
              <div className="flex flex-col h-full">
                <h3 className="text-lg font-bold text-blue-900 mb-3">
                  Already have an LMN? Proceed directly to payment!
                </h3>
                <p className="text-sm text-blue-800 mb-4 flex-1">
                  If you already have a Letter of Medical Necessity for this service, you can proceed
                  directly to payment and use your HSA/FSA funds for reimbursement.
                </p>
                <button
                  onClick={async () => {
                    try {
                      const servicePrice = bookingOption.price || 80;
                      const baseUrl = window.location.origin;
                      const successUrl = `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
                      const cancelUrl = `${baseUrl}${window.location.pathname}?canceled=true`;

                      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/create-checkout-session`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          amount: servicePrice,
                          stripeAcctId: stripeAcctId,
                          paymentOption: 'service-only',
                          servicePrice: servicePrice,
                          serviceName: bookingOption.name,
                          duration: bookingOption.duration || '60 min',
                          firstHealthCondition: null, // Service-only payments don't have health conditions
                          businessName: service.name,
                          businessAddress: service.address || '',
                          takeRate: service.takeRate,
                          receiptEmail: null,
                          successUrl: successUrl,
                          cancelUrl: cancelUrl,
                          metadata: {
                            source: 'saga-health-service-only',
                      serviceName: bookingOption.name,
                      businessName: service.name,
                          }
                        }),
                      });

                      if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`Failed to create checkout session: ${errorText}`);
                      }

                      const data = await response.json();
                      if (data.url) {
                        window.location.href = data.url;
                      } else {
                        throw new Error('No checkout URL received');
                      }
                    } catch (error) {
                      console.error('Error creating checkout session:', error);
                      alert(`Payment failed: ${error.message}`);
                    } 
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Pay for my appointment (${(bookingOption?.price || 80).toFixed(2)})
                </button>
              </div>
              </div>
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Confirmed Form Popup */}
      {showBookingConfirmed && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowBookingConfirmed(false)}></div>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full transform transition-all relative">
              <button
                onClick={() => setShowBookingConfirmed(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div>
                <div className="text-center mb-6">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                    <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
                  <p className="text-gray-600 mb-4">Please provide your details to complete the booking.</p>
                </div>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  
                  // Mark booking as confirmed
                  setBookingConfirmed(true);
                  
                  // Increment booking_count in Supabase
                  if (service?.id) {
                    try {
                      // Fetch current booking_count
                      const { data: currentData, error: fetchError } = await supabase
                        .from('providers')
                        .select('booking_count')
                        .eq('id', service.id)
                        .single();
                      
                      if (!fetchError && currentData) {
                        const newCount = (currentData.booking_count || 0) + 1;
                        
                        // Update booking_count
                        await supabase
                          .from('providers')
                          .update({ booking_count: newCount })
                          .eq('id', service.id);
                      }
                    } catch (err) {
                      console.error('Error updating booking count:', err);
                    }
                  }

                  // Save form data to client_referrals table
                  if (service?.id && formData.firstName && formData.lastName) {
                    try {
                      // Get date in EST timezone (America/New_York handles EST/EDT automatically)
                      const now = new Date();
                      const estDateString = now.toLocaleString('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
                      const [month, day, year] = estDateString.split('/');
                      const today = `${year}-${month}-${day}`; // Format as YYYY-MM-DD
                      // Use class/package selected if available, otherwise fall back to service name
                      const serviceName = formData.classPackage || bookingOption?.name || bookingOption?.serviceType || service?.name || 'Wellness service';
                      
                      const { error: referralError } = await supabase
                        .from('client_referrals')
                        .insert({
                          first_name: formData.firstName,
                          last_name: formData.lastName,
                          email: formData.email || null,
                          date: today,
                          service: serviceName,
                          provider_id: service.id
                        });
                      
                      if (referralError) {
                        console.error('Error saving client referral:', referralError);
                      } else {
                        console.log('Client referral saved successfully');
                      }
                    } catch (err) {
                      console.error('Error saving client referral:', err);
                    }
                  }
                  
                  // Close the popup
                  setShowBookingConfirmed(false);
                }} className="space-y-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Enter your last name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-gray-500 text-xs">(optional)</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Enter your email"
                    />
                  </div>
                  {(() => {
                    console.log('Form render - oneBookingLink:', oneBookingLink, 'classOfferings.length:', classOfferings.length, 'classOfferings:', classOfferings);
                    return null;
                  })()}
                  {oneBookingLink && classOfferings.length > 0 && (
                    <div>
                      <label htmlFor="classPackage" className="block text-sm font-medium text-gray-700 mb-2">
                        Class or Package Selected <span className="text-gray-500 text-xs">(optional)</span>
                      </label>
                      <select
                        id="classPackage"
                        value={formData.classPackage}
                        onChange={(e) => setFormData({ ...formData, classPackage: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900"
                      >
                        <option value="" style={{ color: '#6b7280' }}>Select a class or package...</option>
                        {classOfferings.map((offering) => (
                          <option key={offering.id} value={offering.class_or_package_name}>
                            {offering.class_or_package_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
                  >
                    Submit
                  </button>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

