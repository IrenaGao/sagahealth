import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Helper function to build a Supabase ILIKE pattern from URL slug
const buildBusinessNameQuery = (slug) => {
  if (!slug) return '';
  const decoded = decodeURIComponent(slug);
  const normalized = decoded
    .replace(/[_-]+/g, '%')
    .replace(/%+/g, '%');
  return `%${normalized}%`;
};

export default function ServiceDetails() {
  const { businessName: businessSlug } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchServiceDetails();
  }, [businessSlug]);

  const fetchServiceDetails = async () => {
    try {
      setLoading(true);
      
      const searchPattern = buildBusinessNameQuery(businessSlug);
      
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
        // Handle business_type as array or single value
        let categories = []
        if (Array.isArray(data.business_type)) {
          categories = data.business_type
        } else if (data.business_type) {
          categories = [data.business_type]
        } else {
          categories = ['Other']
        }
        
        // Map database fields to frontend expectations
        const mappedData = {
          id: data.id,
          name: data.business_name || 'Unnamed Business',
          categories: categories, // Now an array
          description: data.short_summary || '',
          bookingLink: data.booking_link || '',
          rating: data.rating || null,
          reviewCount: data.num_reviews || 0,
          address: data.address || '',
          image: data.image || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&h=600&fit=crop',
          stripeAcctId: data.stripe_acct_id || null,
          bookingSystemEnabled: data.booking_system !== false,
          oneBookingLink: data.one_booking_link === true,
        };
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
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back to Marketplace</span>
            </button>
          </div>
        </div>
      </div>

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
                  {category}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Service Info Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Name and Rating */}
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">{service.name}</h1>
            
            {service.rating && (
              <div className="flex items-center gap-2 text-gray-600">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500 text-xl">★</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {service.rating.toFixed(1)}
                  </span>
                </div>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">
                  {service.reviewCount} {service.reviewCount === 1 ? 'review' : 'reviews'}
                </span>
              </div>
            )}
          </div>

          {/* Location */}
          {service.address && (
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-gray-600">{service.address}</p>
              </div>
            </div>
          )}

          {/* Description */}
          {service.description && (
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">About</h2>
              <p className="text-gray-600 leading-relaxed">{service.description}</p>
              <p className="mt-12 text-gray-700">
                <div className="font-semibold">Save ~30% using your HSA/FSA in 3 easy steps:</div>
                <div className="mt-3">1. Pay for your appointment with your credit card as you normally would.</div>
                <div className="mt-2">2: Fill out a quick health survey and pay a $20 LMN evaluation fee. We'll forward your responses to a licensed medical professional.</div>
                <div className="mt-2 mb-3">3. Within 24 hours, you'll receive your Letter of Medical Necessity (LMN). Upload your receipt to your HSA administrator to get reimbursed.</div>
                <div className="font-medium">Keep your LMN in a safe place! It may be required for future verification.</div>
              </p>
            </div>
          )}

          {/* Booking Button */}
          <div className="flex justify-center pt-2">
            <button
              onClick={() => {
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
              }}
              className="w-full sm:w-auto px-8 py-4 bg-emerald-500 text-white text-lg font-semibold rounded-xl shadow-lg hover:bg-emerald-600 transition-all hover:shadow-xl"
            >
              {service.bookingSystemEnabled === false ? 'Get your LMN now' : 'Book Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

