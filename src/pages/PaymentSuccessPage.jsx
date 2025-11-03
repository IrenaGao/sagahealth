import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function PaymentSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signatureRequest, message, paymentOption, paymentIntentId, paymentTotal } = location.state || {};

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
          
          {paymentOption === 'service-only' ? (
            <p className="text-lg text-gray-600 mb-6">
              Your service payment has been successfully completed. You will receive a confirmation email shortly.
            </p>
          ) : (
            <p className="text-lg text-gray-600 mb-6">
              Your Letter of Medical Necessity has been generated and will be emailed to you within 24 hours
              {paymentOption === 'lmn-and-service' && (
                <span className="text-gray-600">, and your service payment has also been successfully completed.</span>
              )}
              <span>You will receive a confirmation email shortly</span>
              {paymentOption !== 'lmn-and-service' && '.'}
            </p>
          )}

          {/* Payment Confirmation (if present) */}
          {paymentIntentId && (
            <div className="text-left bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Payment confirmed</h2>
              <div className="text-sm text-gray-700 space-y-1">
                <p>
                  Amount charged: <span className="font-semibold text-blue-700">${paymentTotal || '—'}</span>
                </p>
                <p>
                  Payment for: <span className="font-semibold">{paymentOption === 'service-only' ? 'Service' : (paymentOption === 'lmn-and-service' ? 'LMN + Service' : 'LMN only')}</span>
                </p>
                <p className="text-gray-500">
                  Reference: <span className="font-mono">{paymentIntentId}</span>
                </p>
              </div>
            </div>
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
                growth@mysagahealth.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}


