
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient.js';
import { buildIlikePattern } from '../../utils/stringUtils.js';

// Controller hook for ServiceDetails

import ServiceDetailsView from './ServiceDetails.view.jsx';
import { faqs } from './ServiceDetails.model.jsx';

export default function ServiceDetails() {
  const { businessName: businessSlug } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchServiceDetails();
    // eslint-disable-next-line
  }, [businessSlug]);

  const fetchServiceDetails = async () => {
    try {
      setLoading(true);
      const searchPattern = buildIlikePattern(businessSlug);
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .ilike('business_name', searchPattern)
        .limit(1)
        .maybeSingle();
      if (error) {
        setError(`Error: ${error.message}`);
        console.error('Error fetching service details:', error);
      } else {
        let categories = [];
        if (Array.isArray(data.business_type)) {
          categories = data.business_type;
        } else if (data.business_type) {
          categories = [data.business_type];
        } else {
          categories = ['Other'];
        }
        const mappedData = {
          id: data.id,
          name: data.business_name || 'Unnamed Business',
          categories: categories,
          description: data.short_summary || '',
          bookingLink: data.booking_link || '',
          rating: data.rating || null,
          reviewCount: data.num_reviews || 0,
          address: data.address || '',
          image: data.image || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&h=600&fit=crop',
          stripeAcctId: data.stripe_acct_id || null,
          bookingSystemEnabled: data.booking_system !== false,
          oneBookingLink: data.one_booking_link === true,
          isApp: data.is_app != null,
        };
        if (data.is_app != null) {
          navigate(`/book/${businessSlug}/schedule`, {
            replace: true,
            state: {
              stripeAcctId: data.stripe_acct_id || null,
              bookingSystemEnabled: true,
            },
          });
          return;
        }
        setService(mappedData);
        setError(null);
      }
    } catch (err) {
      setError(`Failed to fetch: ${err.message}`);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingClick = () => {
    if (service.bookingSystemEnabled === false) {
      navigate(`/book/${businessSlug}/lmn-form`, {
        state: {
          stripeAcctId: service.stripeAcctId,
          bookingSystemEnabled: false,
        },
      });
    } else if (service.oneBookingLink === true) {
      // If one_booking_link is true, skip booking page and go directly to schedule
      navigate(`/book/${businessSlug}/schedule`, {
        state: {
          stripeAcctId: service.stripeAcctId,
          bookingSystemEnabled: true,
        },
      });
    } else {
      navigate(`/book/${businessSlug}`, {
        state: { stripeAcctId: service.stripeAcctId },
      });
    }
  };

  return (
    <ServiceDetailsView
      service={service}
      loading={loading}
      error={error}
      navigate={navigate}
      businessSlug={businessSlug}
      onBookingClick={handleBookingClick}
      faqs={faqs}
    />
  );
}

