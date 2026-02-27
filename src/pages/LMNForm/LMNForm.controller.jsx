import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import LMNFormView from './LMNForm.view.jsx';
import { conditionOptions, stateOptions, hsaProviderOptions } from './LMNForm.model.js';

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


  const urlServiceType = searchParams.get('service');
  const savedServiceName = localStorage.getItem('lmnServiceName');

  const [serviceType, setServiceType] = useState(
    urlServiceType || savedServiceName || 'Wellness service'
  );

  // Update URL if service name changes and isn't in URL
  useEffect(() => {
    if (serviceType && serviceType !== urlServiceType) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('service', serviceType);
      setSearchParams(newParams, { replace: true });
    }
  }, [serviceType, urlServiceType, searchParams, setSearchParams]);

  // Debug logging
  useEffect(() => {
    console.log('LMNForm - Service type:', serviceType);
  }, [serviceType]);

  const totalSteps = 3;
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [providerAddress, setProviderAddress] = useState('');
  const [providerTakeRate, setProviderTakeRate] = useState(null);
  const [customBusinessName, setCustomBusinessName] = useState('');

  const isAnyProvider = businessName === 'Any Provider' || businessName === '' || urlBusinessName === 'any-provider';

  // Fetch provider address and take_rate
  useEffect(() => {
    if (isAnyProvider) return;

    const fetchProviderAddress = async () => {
      try {
        const searchPattern = buildBusinessNameQuery(urlBusinessName);
        const { data, error } = await supabase
          .from('providers')
          .select('address, take_rate')
          .ilike('business_name', searchPattern)
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          if (data.address) setProviderAddress(data.address);
          if (data.take_rate !== null && data.take_rate !== undefined) setProviderTakeRate(data.take_rate);
        }
      } catch (err) {
        console.error('Error fetching provider address:', err);
      }
    };

    fetchProviderAddress();
  }, [urlBusinessName, isAnyProvider]);

  const checkoutAmount = 20;

  // Check if user canceled checkout and restore form data
  useEffect(() => {
    if (searchParams.get('canceled') !== 'true') return;

    setSubmitError('Payment was canceled. You can try again when ready.');

    const savedFormData = localStorage.getItem('lmnFormData');
    const savedServiceName = localStorage.getItem('lmnServiceName');
    const savedCustomBusinessName = localStorage.getItem('lmnCustomBusinessName');

    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        setFormData(parsedData);
        if (isAnyProvider && parsedData.businessName && parsedData.businessName !== 'Any Provider') {
          setCustomBusinessName(parsedData.businessName);
        }
      } catch (e) {
        console.error('Failed to parse saved form data:', e);
      }
    }

    if (savedCustomBusinessName && isAnyProvider && !customBusinessName) setCustomBusinessName(savedCustomBusinessName);

    if (savedServiceName) {
      setServiceType(savedServiceName);
      const newParams = new URLSearchParams(searchParams);
      newParams.set('service', savedServiceName);
      newParams.delete('canceled');
      setSearchParams(newParams, { replace: true });
    }

    const stepParam = searchParams.get('step');
    if (stepParam) {
      const step = parseInt(stepParam, 10);
      if (step >= 1 && step <= totalSteps) setCurrentStep(step);
    } else {
      setCurrentStep(3);
    }

    localStorage.removeItem('lmnFormData');
    localStorage.removeItem('lmnServiceName');
    localStorage.removeItem('lmnCustomBusinessName');
  }, [searchParams, totalSteps, setSearchParams]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    sex: '',
    pregnant: '',
    hsaProvider: '',
    state: '',
    diagnosedConditions: [],
    familyHistory: [],
    riskFactors: [],
    preventiveTargets: '',
    attestation: false
  });

  // Automatically add/remove "Pregnancy" from diagnosedConditions based on pregnancy answer
  useEffect(() => {
    setFormData(prev => {
      const hasPregnancy = prev.diagnosedConditions.includes('Pregnancy');
      if (prev.pregnant === 'Yes' && !hasPregnancy) {
        return { ...prev, diagnosedConditions: [...prev.diagnosedConditions, 'Pregnancy'] };
      } else if (prev.pregnant !== 'Yes' && hasPregnancy) {
        return { ...prev, diagnosedConditions: prev.diagnosedConditions.filter(c => c !== 'Pregnancy') };
      }
      return prev;
    });
  }, [formData.pregnant]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      if (!formData.firstName || !formData.lastName || !formData.age || !formData.hsaProvider || !formData.state) {
        throw new Error('Please fill in all required fields');
      }
      if (isAnyProvider && !customBusinessName.trim()) {
        throw new Error('Please enter a provider/business name');
      }
      if (!formData.attestation) {
        throw new Error('Please agree to the attestation');
      }
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error validating form:', error);
      setSubmitError(error.message);
      setIsSubmitting(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: {
        const baseValid = formData.firstName && formData.lastName && formData.age && formData.sex && formData.hsaProvider && formData.state;
        return isAnyProvider ? baseValid && customBusinessName.trim() !== '' : baseValid;
      }
      case 2:
        return formData.diagnosedConditions.length > 0;
      case 3:
        return formData.attestation;
      default:
        return false;
    }
  };

  return (
    <LMNFormView
      currentStep={currentStep}
      totalSteps={totalSteps}
      formData={formData}
      serviceType={serviceType}
      isAnyProvider={isAnyProvider}
      customBusinessName={customBusinessName}
      businessName={businessName}
      providerAddress={providerAddress}
      providerTakeRate={providerTakeRate}

      checkoutAmount={checkoutAmount}
      isSubmitting={isSubmitting}
      submitError={submitError}
      conditionOptions={conditionOptions}
      stateOptions={stateOptions}
      hsaProviderOptions={hsaProviderOptions}
      navigate={navigate}
      onInputChange={handleInputChange}
      onCheckboxChange={handleCheckboxChange}
      onNext={handleNext}
      onBack={handleBack}
      onSubmit={handleSubmit}
      onPaymentError={handlePaymentError}
onCustomBusinessNameChange={setCustomBusinessName}
      isStepValid={isStepValid}
    />
  );
}
