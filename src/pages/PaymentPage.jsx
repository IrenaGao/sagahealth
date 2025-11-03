import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import StripeProvider from '../components/StripeProvider';
import StripePaymentForm from '../components/StripePaymentForm';

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { formData, servicePrice, serviceName, businessName, serviceOnly } = location.state || {};
  
  // Use provided form data
  const finalFormData = formData || {};
  
  // Use dynamic service price or default to 80
  const dynamicServicePrice = servicePrice || 80;
  
  console.log('PaymentPage - formData from navigation:', formData);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const isServiceOnly = !!serviceOnly;
  const [paymentOption, setPaymentOption] = useState(isServiceOnly ? 'service-only' : 'lmn-only'); // 'lmn-only' | 'lmn-and-service' | 'service-only'

  const handlePaymentSuccess = async (paymentIntentId, paymentIntent) => {
    console.log('Payment successful:', paymentIntent);
    setIsProcessing(true);
    
    try {
      if (isServiceOnly) {
        // Skip LMN generation, just show payment success
        navigate('/payment-success', {
          state: {
            signatureRequest: undefined,
            message: 'Service payment completed',
            paymentOption: 'service-only',
            formData: finalFormData,
            paymentIntentId,
            paymentTotal: dynamicServicePrice.toFixed(2)
          }
        });
        return;
      }

      // Proceed with LMN generation after successful payment
      console.log('Payment successful! Generating LMN...');
      console.log('Sending form data to API:', finalFormData);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/generate-lmn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...finalFormData,
          paymentProcessed: true,
          paymentOption: paymentOption,
          paymentIntentId: paymentIntentId,
          paymentAmount: paymentIntent.amount / 100
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('LMN generation successful:', result);
        
        // Redirect to success page with enhanced state
        navigate('/payment-success', { 
          state: { 
            signatureRequest: result.signatureRequest,
            message: result.message,
            paymentOption: paymentOption,
            formData: finalFormData,
            paymentIntentId: paymentIntentId,
            paymentTotal: (paymentOption === 'lmn-and-service' ? (20 + dynamicServicePrice) : 20).toFixed(2)
          }
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error(`Failed to generate LMN: ${errorData.error || errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('LMN generation failed:', error);
      alert(`Payment successful but LMN generation failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (errorMessage) => {
    console.error('Payment failed:', errorMessage);
    alert(`Payment failed: ${errorMessage}`);
    setIsProcessing(false);
  };


  return (
    <StripeProvider>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1920px] mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 pt-6 pb-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Saga Health</h1>
          </button>
        </div>
      </div>
      
      <div className="py-8">
        <div className="max-w-2xl mx-auto px-4">
        
        
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isServiceOnly ? 'Pay for your appointment' : 'Complete Your Payment'}
            </h1>
            <p className="text-gray-600">
              {isServiceOnly
                ? 'Enter your payment details to pay for your service appointment.'
                : 'Please enter your payment details to process your LMN request'}
            </p>
          </div>

          {/* Stripe Payment Form */}
          <StripePaymentForm
            amount={isServiceOnly ? dynamicServicePrice : (paymentOption === 'lmn-and-service' ? (20 + dynamicServicePrice) : 20)}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
            isProcessing={isProcessing}
          />

            {/* Payment Options */}
            {!isServiceOnly && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Options</h2>
              <div className="space-y-4">
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
                    Pay for LMN only - I'll book the service later but want to get my LMN now ($20.00)
                  </label>
                </div>
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
                    Pay for LMN + Service together (LMN: $20.00 + Service: ${dynamicServicePrice.toFixed(2)})
                  </label>
                </div>
              </div>
            </div>
            )}

            {/* Payment Summary */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Summary</h2>
              <div className="space-y-2">
                {!isServiceOnly && (
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-900">LMN Processing Fee</span>
                    <span className="text-xl font-bold text-blue-600">$20.00</span>
                  </div>
                )}
                {(isServiceOnly || paymentOption === 'lmn-and-service') && (
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-900">Service Payment</span>
                    <span className="text-xl font-bold text-blue-600">${dynamicServicePrice.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-blue-200 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ${isServiceOnly ? dynamicServicePrice.toFixed(2) : (paymentOption === 'lmn-and-service' ? (20 + dynamicServicePrice).toFixed(2) : '20.00')}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {isServiceOnly
                  ? 'This covers payment for your service appointment.'
                  : paymentOption === 'lmn-only' 
                    ? 'This fee covers the generation and processing of your Letter of Medical Necessity only.'
                    : 'This includes LMN processing and payment for your wellness service appointment.'}
              </p>
            </div>

            {/* Back Button */}
            <div className="flex justify-start items-center pt-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Back to Form
              </button>
            </div>
        </div>
      </div>
      </div>
      </div>
    </StripeProvider>
  );
}
