import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import EmbeddedBookingView from './EmbeddedBooking.view.jsx';

// Helper function to convert URL-friendly name back to potential business name matches
const fromUrlFriendly = (urlName) => {
  const decoded = decodeURIComponent(urlName);
  const normalized = decoded.replace(/[_-]+/g, '%').replace(/%+/g, '%');
  return `%${normalized}%`;
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
  return '✨';
};

export default function EmbeddedBooking() {
  const { businessName } = useParams();
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

      const searchPattern = fromUrlFriendly(businessName);

      const { data: providerData, error: providerError } = await supabase
        .from('providers')
        .select('*')
        .ilike('business_name', searchPattern)
        .limit(1)
        .maybeSingle();

      if (providerError) {
        setError(`Error: ${providerError.message}`);
        return;
      }

      if (!providerData) {
        setError('Provider not found');
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
        categories,
        description: providerData.short_summary || '',
        address: providerData.address || '',
        rating: providerData.rating || null,
        reviewCount: providerData.num_reviews || 0,
        takeRate: providerData.take_rate || null,
        isApp: providerData.is_app != null,
        appImageUrl: providerData.is_app || null,
        widgetType: providerData.widget_type || null,
      });

      setOneBookingLink(providerData.one_booking_link === true);
      setBookingLink(providerData.booking_link || null);

      if (!stripeAcctId && providerData.stripe_acct_id) {
        setStripeAcctId(providerData.stripe_acct_id);
      }

      const { data: servicesData, error: servicesError } = await supabase
        .from('provider_services')
        .select('*')
        .eq('business_id', providerData.id);

      if (servicesError) {
        console.error('Error fetching services:', servicesError);
        setBookingOptions([]);
      } else {
        const options = servicesData.map((service, index) => {
          const serviceName = service.service_name || service.service_type || 'Service';
          console.log('Service data:', {
            service_name: service.service_name,
            service_type: service.service_type,
            url: service.booking_link,
            description: service.description,
            using: serviceName
          });
          return {
            id: index + 1,
            serviceId: service.id,
            name: serviceName,
            serviceType: serviceName,
            duration: formatDuration(service.duration_in_mins || 60),
            url: service.booking_link || '',
            icon: getServiceIcon(service.service_type),
            description: service.description || null,
          };
        });

        setBookingOptions(options);

        if (servicesData && servicesData.length > 0) {
          const linkValue = servicesData[0]?.booking_link || null;
          console.log("Setting bookingLink to:", linkValue);
          setBookingLink(linkValue);
        }

        if (bookingOptionId) {
          const selected = options.find(opt => opt.id === bookingOptionId);
          setBookingOption(selected);
        } else if (options.length >= 1) {
          setBookingOption(options[0]);
        }
      }
    } catch (err) {
      setError(`Failed to fetch: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch class offerings when service is available
  useEffect(() => {
    const fetchClassOfferings = async () => {
      if (service?.id) {
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
            setClassOfferings(data || []);
          }
        } catch (err) {
          console.error('Error fetching class offerings:', err);
          setClassOfferings([]);
        }
      } else {
        setClassOfferings([]);
      }
    };

    fetchClassOfferings();
  }, [service?.id]);

  const onBookingComplete = () => {
    console.log('Booking completed!');
    const serviceType = bookingOption?.serviceType || bookingOption?.name || 'Wellness service';
    console.log('EmbeddedBooking - Navigating with serviceType:', serviceType);
    console.log('EmbeddedBooking - bookingOption:', bookingOption);
    navigate(`/book/${businessName}/lmn-form?service=${encodeURIComponent(serviceType)}`, {
      state: { stripeAcctId }
    });
    return true;
  };

  const handleAppStoreClick = (e, appUrl) => {
    e.preventDefault();
    const url = appUrl || bookingOption?.url || '';
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Check if user canceled checkout
  useEffect(() => {
    if (searchParams.get('canceled') === 'true') {
      alert('Payment was canceled. You can try again when ready.');
    }
  }, [searchParams]);

  // Monitor iframe load events
  const handleIframeLoad = () => {
    console.log('Calendar iframe loaded');
    try {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        const iframeUrl = iframeRef.current.contentWindow.location.href;
        console.log('Iframe URL:', iframeUrl);
        if (iframeUrl.includes('confirmed') || iframeUrl.includes('success')) {
          onBookingComplete();
        }
      }
    } catch (e) {
      console.log('Cannot access iframe URL (CORS protected)');
    }
  };

  const handleBookingConfirmSubmit = async (e) => {
    e.preventDefault();
    setBookingConfirmed(true);

    if (service?.id) {
      try {
        const { data: currentData, error: fetchError } = await supabase
          .from('providers')
          .select('booking_count')
          .eq('id', service.id)
          .single();

        if (!fetchError && currentData) {
          const newCount = (currentData.booking_count || 0) + 1;
          await supabase
            .from('providers')
            .update({ booking_count: newCount })
            .eq('id', service.id);
        }
      } catch (err) {
        console.error('Error updating booking count:', err);
      }
    }

    if (service?.id && formData.firstName && formData.lastName) {
      try {
        const now = new Date();
        const estDateString = now.toLocaleString('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
        const [month, day, year] = estDateString.split('/');
        const today = `${year}-${month}-${day}`;
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

    setShowBookingConfirmed(false);
  };

  return (
    <EmbeddedBookingView
      service={service}
      bookingOption={bookingOption}
      bookingOptions={bookingOptions}
      loading={loading}
      error={error}
      oneBookingLink={oneBookingLink}
      bookingLink={bookingLink}
      bookingConfirmed={bookingConfirmed}
      showBookingConfirmed={showBookingConfirmed}
      formData={formData}
      classOfferings={classOfferings}
      iframeRef={iframeRef}
      businessName={businessName}
      navigate={navigate}
      onBookingComplete={onBookingComplete}
      onAppStoreClick={handleAppStoreClick}
      onIframeLoad={handleIframeLoad}
      onShowBookingConfirmed={() => setShowBookingConfirmed(true)}
      onCloseBookingConfirmed={() => setShowBookingConfirmed(false)}
      onFormDataChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
      onBookingConfirmSubmit={handleBookingConfirmSubmit}
    />
  );
}
