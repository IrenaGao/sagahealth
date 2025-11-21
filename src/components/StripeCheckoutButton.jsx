import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function StripeCheckoutButton({ 
  amount, 
  stripeAcctId, 
  paymentOption, 
  servicePrice, 
  serviceName,
  duration,
  firstHealthCondition,
  businessName,
  businessAddress,
  receiptEmail,
  formData,
  onError 
}) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Debug logging
      console.log('StripeCheckoutButton - Service name being sent:', serviceName);
      
      // Save form data to localStorage before redirecting to Stripe
      // This allows us to restore it when user comes back from cancel
      if (formData) {
        localStorage.setItem('lmnFormData', JSON.stringify(formData));
        localStorage.setItem('lmnPaymentOption', paymentOption || 'lmn-only');
        localStorage.setItem('lmnServicePrice', servicePrice?.toString() || '80');
        localStorage.setItem('lmnServiceName', serviceName || '');
        localStorage.setItem('lmnDuration', duration || '60 min');
      }

      // Build success and cancel URLs
      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
      // Cancel URL should go back to the current page
      const currentPath = window.location.pathname;
      const cancelUrl = `${baseUrl}${currentPath}?canceled=true&step=4`;

      // Create checkout session
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          stripeAcctId: stripeAcctId,
          paymentOption: paymentOption,
          servicePrice: servicePrice,
          serviceName: serviceName,
          duration: duration,
          firstHealthCondition: firstHealthCondition,
          businessName: businessName,
          businessAddress: businessAddress,
          customerFirstName: formData?.firstName || null,
          customerLastName: formData?.lastName || null,
          receiptEmail: receiptEmail,
          successUrl: successUrl,
          cancelUrl: cancelUrl,
          metadata: {
            source: 'saga-health-lmn',
            formData: formData ? JSON.stringify(formData) : undefined,
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const { url } = data;

      if (!url) {
        throw new Error('Failed to create checkout session - no URL received');
      }

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (err) {
      const errorMessage = err.message || 'Failed to start checkout';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleCheckout}
        disabled={isLoading}
        className={`w-full px-6 py-3 rounded-lg font-semibold text-white ${
          isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isLoading ? 'Loading...' : `Pay $${amount.toFixed(2)}`}
      </button>
      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}
    </div>
  );
}

