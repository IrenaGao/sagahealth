import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

export default function PaymentSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signatureRequest, message, paymentOption, paymentIntentId, paymentTotal, formData } = location.state || {};
  const [sessionData, setSessionData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const lmnGenerationTriggeredRef = useRef(false);
  const checkoutSessionFetchedRef = useRef(null); // Store the sessionId that was fetched

  // Get session_id from URL if coming from Checkout
  const sessionId = searchParams.get('session_id');

  // Clear localStorage on successful payment
  useEffect(() => {
    if (sessionId) {
      // Clear any saved form data since payment was successful
      localStorage.removeItem('lmnFormData');
      localStorage.removeItem('lmnPaymentOption');
      localStorage.removeItem('lmnServicePrice');
      localStorage.removeItem('lmnServiceName');
      localStorage.removeItem('lmnDuration');
    }
  }, [sessionId]);


  // Fetch checkout session details if session_id is present (only once per sessionId)
  useEffect(() => {
    if (sessionId && checkoutSessionFetchedRef.current !== sessionId) {
      checkoutSessionFetchedRef.current = sessionId;
      setIsLoading(true);
      console.log('Fetching checkout session for:', sessionId);
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/checkout-session?session_id=${sessionId}`)
        .then(res => res.json())
        .then(data => {
          console.log('Session data received:', data);
          console.log('Payment option:', data.paymentOption);
          console.log('Service receipt PDF available:', !!data.serviceReceiptPDF);
          setSessionData(data);
          setIsLoading(false);
          
          // Receipt is now emailed automatically - no need to download
          if (data.serviceReceiptPDF) {
            console.log('Service receipt has been generated and will be emailed to the customer');
          }
          
          // Trigger LMN generation if needed (only once)
          if (data.paymentOption && data.paymentOption !== 'service-only' && data.formData && !lmnGenerationTriggeredRef.current) {
            lmnGenerationTriggeredRef.current = true;
            console.log('Payment successful! Generating LMN in background...');
            fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/generate-lmn`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...data.formData,
                // Include email from checkout session if available (since email was removed from form)
                email: data.customerEmail || data.formData.email || null,
                paymentProcessed: true,
                paymentOption: data.paymentOption,
                paymentIntentId: data.paymentIntentId,
                paymentAmount: data.amount
              }),
            })
              .then(response => {
                if (response.ok) {
                  return response.json();
                } else {
                  return response.json().then(errorData => {
                    throw new Error(errorData.error || errorData.message || 'Unknown error');
                  });
                }
              })
              .then(result => {
                console.log('LMN generation successful:', result);
              })
              .catch(error => {
                console.error('LMN generation failed (background):', error);
                // Reset ref on error so it can be retried if needed
                lmnGenerationTriggeredRef.current = false;
              });
          } else if (lmnGenerationTriggeredRef.current) {
            console.log('LMN generation already triggered, skipping duplicate request');
          }
        })
        .catch(err => {
          console.error('Failed to fetch checkout session:', err);
          setIsLoading(false);
          // Reset ref on error so it can be retried
          checkoutSessionFetchedRef.current = null;
        });
    } else if (sessionId && checkoutSessionFetchedRef.current === sessionId) {
      console.log('Checkout session already fetched for this sessionId, skipping duplicate call');
    }
  }, [sessionId]);

  // Use session data if available, otherwise use location state
  const finalPaymentOption = sessionData?.paymentOption || paymentOption;
  const finalPaymentIntentId = sessionData?.paymentIntentId || paymentIntentId;
  const finalPaymentTotal = sessionData?.amount ? (sessionData.amount / 100).toFixed(2) : paymentTotal;

  return (
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
      
      <div className="flex items-center justify-center py-8">
        <div className="max-w-2xl mx.auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Success!
          </h1>
          
          {isLoading ? (
            <p className="text-lg text-gray-600 mb-6">Loading payment details...</p>
          ) : (
            <>
              {finalPaymentOption === 'service-only' ? (
            <p className="text-lg text-gray-600 mb-6">
                  Your appointment payment has been successfully completed. You will receive a confirmation email shortly.
            </p>
          ) : (
            <p className="text-lg text-gray-600 mb-6">
              Your Letter of Medical Necessity has been generated and will be emailed to you within 24 hours
                  {finalPaymentOption === 'lmn-and-service' && (
                    <span className="text-gray-600">, and your appointment payment has also been successfully completed</span>
              )}
              <span>. You will receive a confirmation email shortly</span>
                  {finalPaymentOption !== 'lmn-and-service' && '.'}
            </p>
          )}

          {/* Payment Confirmation (if present) */}
              {finalPaymentIntentId && (
            <div className="text-left bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Payment confirmed</h2>
              <div className="text-sm text-gray-700 space-y-1">
                <p>
                      Amount charged: <span className="font-semibold text-blue-700">${finalPaymentTotal || '—'}</span>
                </p>
                <p>
                      Payment for: <span className="font-semibold">{finalPaymentOption === 'service-only' ? 'Service' : (finalPaymentOption === 'lmn-and-service' ? 'LMN + Appointment' : 'LMN only')}</span>
                </p>
                <p className="text-gray-500">
                      Reference: <span className="font-mono">{finalPaymentIntentId}</span>
                </p>
              </div>
            </div>
              )}

            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
            >
              Return to Home
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Need help? Contact our support team at{' '}
              <a href="mailto:growth@mysagahealth.com" className="text-blue-600 hover:text-blue-700">
                support@mysagahealth.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}


