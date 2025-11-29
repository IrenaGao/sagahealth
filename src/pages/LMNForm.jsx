import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import StripeCheckoutButton from '../components/StripeCheckoutButton';
import { supabase } from '../supabaseClient';

// Helper function to convert URL-friendly name to proper format
const formatBusinessName = (urlName) => {
  if (!urlName) return '';
  return urlName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const buildBusinessNameQuery = (slug) => {
  if (!slug) return '';
  const decoded = decodeURIComponent(slug);
  const normalized = decoded
    .replace(/[_-]+/g, '%')
    .replace(/%+/g, '%');
  return `%${normalized}%`;
};

export default function LMNForm() {
  const navigate = useNavigate();
  const { businessName: urlBusinessName } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const businessName = formatBusinessName(urlBusinessName);
  const stripeAcctId = location.state?.stripeAcctId || null;
  const initialBookingSystemState = location.state?.bookingSystemEnabled;
  
  // Get service name, price, and duration from URL, with fallback to localStorage if coming back from cancel
  const urlServiceType = searchParams.get('service');
  const urlServicePrice = searchParams.get('price');
  const urlDuration = searchParams.get('duration');
  const savedServiceName = localStorage.getItem('lmnServiceName');
  const savedServicePrice = localStorage.getItem('lmnServicePrice');
  const savedDuration = localStorage.getItem('lmnDuration');
  
  // Use URL params if available, otherwise use saved values, otherwise default
  const [serviceType, setServiceType] = useState(
    urlServiceType || savedServiceName || 'Wellness service'
  );
  const [servicePrice, setServicePrice] = useState(
    urlServicePrice ? parseFloat(urlServicePrice) : (savedServicePrice ? parseFloat(savedServicePrice) : 80)
  );
  const [duration, setDuration] = useState(
    urlDuration || savedDuration || '60 min'
  );
  
  // Update URL if service name/price/duration changes and isn't in URL
  useEffect(() => {
    if (serviceType && serviceType !== urlServiceType) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('service', serviceType);
      newParams.set('price', servicePrice.toString());
      if (duration) {
        newParams.set('duration', duration);
      }
      setSearchParams(newParams, { replace: true });
    }
  }, [serviceType, servicePrice, duration, urlServiceType, searchParams, setSearchParams]);
  
  // Debug logging
  useEffect(() => {
    console.log('LMNForm - Service type:', serviceType);
    console.log('LMNForm - Service price:', servicePrice);
  }, [serviceType, servicePrice]);
  
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [paymentOption, setPaymentOption] = useState('lmn-only'); // 'lmn-only' | 'lmn-and-service'
  const [providerAddress, setProviderAddress] = useState('');
  const [providerTakeRate, setProviderTakeRate] = useState(null);
  const [bookingSystemEnabled, setBookingSystemEnabled] = useState(
    initialBookingSystemState !== undefined ? initialBookingSystemState : true
  );

  const [oneBookingLink, setOneBookingLink] = useState(false);

  // Fetch provider address, booking system flag, take_rate, and one_booking_link
  useEffect(() => {
    const fetchProviderAddress = async () => {
      try {
        const searchPattern = buildBusinessNameQuery(urlBusinessName);
        const { data, error } = await supabase
          .from('providers')
          .select('address, booking_system, take_rate, one_booking_link')
          .ilike('business_name', searchPattern)
          .limit(1)
          .maybeSingle();
        
        if (!error && data) {
          if (data.address) {
            setProviderAddress(data.address);
          }
          if (typeof data.booking_system !== 'undefined') {
            setBookingSystemEnabled(data.booking_system !== false);
          }
          if (data.take_rate !== null && data.take_rate !== undefined) {
            setProviderTakeRate(data.take_rate);
          }
          if (data.one_booking_link === true) {
            setOneBookingLink(true);
            // Force LMN-only payment when one_booking_link is true
            setPaymentOption('lmn-only');
          }
        }
      } catch (err) {
        console.error('Error fetching provider address:', err);
      }
    };
    
    fetchProviderAddress();
  }, [urlBusinessName]);

  // Force LMN-only payment when provider does not have a booking system or when one_booking_link is true
  useEffect(() => {
    if ((bookingSystemEnabled === false || oneBookingLink === true) && paymentOption !== 'lmn-only') {
      setPaymentOption('lmn-only');
    }
  }, [bookingSystemEnabled, oneBookingLink, paymentOption]);

  const checkoutAmount = (bookingSystemEnabled === false || oneBookingLink === true)
    ? 20
    : paymentOption === 'lmn-and-service'
      ? (20 + servicePrice)
      : 20;

  // Check if user canceled checkout and restore form data
  useEffect(() => {
    if (searchParams.get('canceled') === 'true') {
      setSubmitError('Payment was canceled. You can try again when ready.');
      
      // Restore form data from localStorage
      const savedFormData = localStorage.getItem('lmnFormData');
      const savedPaymentOption = localStorage.getItem('lmnPaymentOption');
      const savedServiceName = localStorage.getItem('lmnServiceName');
      const savedServicePrice = localStorage.getItem('lmnServicePrice');
      
      if (savedFormData) {
        try {
          const parsedData = JSON.parse(savedFormData);
          setFormData(parsedData);
        } catch (e) {
          console.error('Failed to parse saved form data:', e);
        }
      }
      
      if (savedPaymentOption) {
        setPaymentOption(savedPaymentOption);
      }
      
      // Restore service name, price, and duration from localStorage
      if (savedServiceName) {
        setServiceType(savedServiceName);
        // Update URL to include service name
        const newParams = new URLSearchParams(searchParams);
        newParams.set('service', savedServiceName);
        if (savedServicePrice) {
          newParams.set('price', savedServicePrice);
          setServicePrice(parseFloat(savedServicePrice));
        }
        if (savedDuration) {
          newParams.set('duration', savedDuration);
          setDuration(savedDuration);
        }
        newParams.delete('canceled'); // Remove canceled param
        setSearchParams(newParams, { replace: true });
      }
      
      if (savedServicePrice) {
        setServicePrice(parseFloat(savedServicePrice));
      }
      
      if (savedDuration) {
        setDuration(savedDuration);
      }
      
      // Set to step 3 (attestation & payment page) if step param is provided
      const stepParam = searchParams.get('step');
      if (stepParam) {
        const step = parseInt(stepParam, 10);
        if (step >= 1 && step <= totalSteps) {
          setCurrentStep(step);
        }
      } else {
        setCurrentStep(3);
      }
      
      // Clear localStorage after restoring (but keep service name/price in URL)
      localStorage.removeItem('lmnFormData');
      localStorage.removeItem('lmnPaymentOption');
      localStorage.removeItem('lmnServicePrice');
      localStorage.removeItem('lmnServiceName');
      localStorage.removeItem('lmnDuration');
    }
  }, [searchParams, totalSteps, setSearchParams]);
  
  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    sex: '',
    hsaProvider: '',
    state: '',
    diagnosedConditions: [],
    familyHistory: [],
    riskFactors: [],
    preventiveTargets: '',
    attestation: false
  });

  // Available options for conditions
  const conditionOptions = [
    'Anxiety',
    'Depression',
    'Chronic Pain',
    'Arthritis',
    'High Blood Pressure',
    'Diabetes',
    'Heart Disease',
    'Obesity',
    'Sleep Disorders',
    'Stress',
    'Other'
  ];

  // US States
  const stateOptions = [
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' },
    { code: 'DC', name: 'Washington D.C.' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckboxChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePaymentError = (errorMessage) => {
    console.error('Payment failed:', errorMessage);
    setSubmitError(`Payment failed: ${errorMessage}`);
    setIsSubmitting(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Validate form data
      if (!formData.firstName || !formData.lastName || !formData.age || !formData.hsaProvider || !formData.state) {
        throw new Error('Please fill in all required fields');
      }
      
      if (!formData.attestation) {
        throw new Error('Please agree to the attestation');
      }
      
      // Payment will be handled by StripeCheckoutButton component
      // No need to navigate - payment button is on this page
      setIsSubmitting(false);
      
    } catch (error) {
      console.error('Error validating form:', error);
      setSubmitError(error.message);
      setIsSubmitting(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.firstName && formData.lastName && formData.age && formData.sex && formData.hsaProvider && formData.state;
      case 2:
        // Require at least one diagnosed condition for LMN generation
        return formData.diagnosedConditions.length > 0;
      case 3:
        return formData.attestation;
      default:
        return false;
    }
  };

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
              onClick={() => navigate(`/book/${urlBusinessName}/schedule`)}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Booking
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Get Your Letter of Medical Necessity
            </h2>
            <p className="text-gray-600">
              Answer a few questions to receive your personalized LMN
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Information & Demographics */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information & Demographics</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="John"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How old are you? *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="120"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What is your sex assigned at birth? *
                  </label>
                  <select
                    required
                    value={formData.sex}
                    onChange={(e) => handleInputChange('sex', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Intersex">Intersex</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Who is your HSA provider? *
                  </label>
                  <select
                    required
                    value={formData.hsaProvider}
                    onChange={(e) => handleInputChange('hsaProvider', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Select your HSA provider...</option>
                    <option value="HealthEquity">HealthEquity</option>
                    <option value="Fidelity">Fidelity</option>
                    <option value="Lively">Lively</option>
                    <option value="HSA Bank">HSA Bank</option>
                    <option value="Optum Bank">Optum Bank</option>
                    <option value="Further">Further</option>
                    <option value="Bank of America">Bank of America</option>
                    <option value="WageWorks">WageWorks</option>
                    <option value="FSA Feds">FSA Feds</option>
                    <option value="PA Group">PA Group</option>
                    <option value="WEX">WEX</option>
                    <option value="PayFlex">PayFlex</option>
                    <option value="HealthSavings Administrators">HealthSavings Administrators</option>
                    <option value="ConnectYourCare">ConnectYourCare</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What state do you live in? *
                  </label>
                  <select
                    required
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Select your state...</option>
                    {stateOptions.map(state => (
                      <option key={state.code} value={state.code}>
                        {state.name} ({state.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Step 2: Health Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Have you been diagnosed with any of the following conditions? *
                  </label>
                  <p className="text-sm text-gray-600 mb-2">Select at least one condition to continue</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    {conditionOptions.map(condition => (
                      <label key={condition} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.diagnosedConditions.includes(condition)}
                          onChange={() => handleCheckboxChange('diagnosedConditions', condition)}
                          className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <span className="text-sm text-gray-700">{condition}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Do you have a family history of any of the following conditions?
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    {conditionOptions.map(condition => (
                      <label key={condition} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.familyHistory.includes(condition)}
                          onChange={() => handleCheckboxChange('familyHistory', condition)}
                          className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <span className="text-sm text-gray-700">{condition}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Do you have any risk factors?
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    {conditionOptions.map(condition => (
                      <label key={condition} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.riskFactors.includes(condition)}
                          onChange={() => handleCheckboxChange('riskFactors', condition)}
                          className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <span className="text-sm text-gray-700">{condition}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Why do you want to prevent these conditions?
                  </label>
                  <textarea
                    value={formData.preventiveTargets}
                    onChange={(e) => handleInputChange('preventiveTargets', e.target.value)}
                    rows="4"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Tell us about your health goals and why you want to prevent these conditions..."
                  />
                </div>
              </div>
            )}

            {/* Step 3: Attestation */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Attestation & Payment</h3>
                
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex gap-3 mb-4">
                    <svg className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="text-base font-semibold text-blue-900 mb-3">
                        HSA/FSA Eligibility Attestation
                      </h4>
                      <div className="text-sm text-blue-900 space-y-3">
                        <p>
                          I confirm that this purchase is primarily intended to cure, mitigate, treat, or prevent the diagnosed medical condition(s) I have identified in this form.
                        </p>
                        <p>
                          I further confirm that I would not be making this purchase if not for my diagnosed medical condition(s).
                        </p>
                        <p>
                          I understand that Saga Health and its partners rely on the accuracy of the information I provide. If these statements are inaccurate, my purchases may not be eligible for HSA/FSA reimbursement.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-gray-300 rounded-xl p-6 bg-gray-50">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={formData.attestation}
                      onChange={(e) => handleInputChange('attestation', e.target.checked)}
                      className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 mt-0.5 flex-shrink-0"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      I have read and agree to the attestation above. I certify that all information provided is true and accurate to the best of my knowledge. *
                    </span>
                  </label>
                </div>

                {/* Payment Options */}
                {bookingSystemEnabled !== false && oneBookingLink !== true && (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Options</h2>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="lmn-and-service"
                          name="paymentOption"
                          value="lmn-and-service"
                          checked={paymentOption === 'lmn-and-service'}
                          onChange={(e) => setPaymentOption(e.target.value)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label htmlFor="lmn-and-service" className="text-sm font-medium text-gray-900">
                          Pay for LMN + Appt. together ($20.00 LMN + ${servicePrice.toFixed(2)} Appt. = ${(20 + servicePrice).toFixed(2)} Total)
                        </label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="lmn-only"
                          name="paymentOption"
                          value="lmn-only"
                          checked={paymentOption === 'lmn-only'}
                          onChange={(e) => setPaymentOption(e.target.value)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label htmlFor="lmn-only" className="text-sm font-medium text-gray-900">
                          Pay for LMN only - I'll book the appt. later but want to get my LMN now ($20.00)
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Button */}
                <div className="pt-4">
                  <StripeCheckoutButton
                    amount={checkoutAmount}
                    onError={handlePaymentError}
                    stripeAcctId={stripeAcctId}
                    paymentOption={paymentOption}
                    servicePrice={servicePrice}
                    serviceName={serviceType}
                    duration={duration}
                    firstHealthCondition={formData.diagnosedConditions?.[0] || null}
                    businessName={businessName}
                    businessAddress={providerAddress}
                    takeRate={providerTakeRate}
                    receiptEmail={null}
                    formData={{
                      ...formData,
                      desiredProduct: serviceType,
                      businessName: businessName
                    }}
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  currentStep === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    isStepValid()
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Next
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <div className="text-sm text-gray-500">
                  {/* Payment button is now on the attestation page itself */}
                  Clicking on the Payment button will take you to the Stripe Checkout page.
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Error Message */}
        {submitError && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-900 mb-1">Error Submitting Form</h3>
                <p className="text-sm text-red-800">{submitError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">Your Information is Secure</h3>
              <p className="text-sm text-blue-800">
                All information is encrypted and HIPAA-compliant. Your LMN will be delivered to your email within 24 hours.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

