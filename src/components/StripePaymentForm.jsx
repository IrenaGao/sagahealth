import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

export default function StripePaymentForm({ amount, onPaymentSuccess, onPaymentError, isProcessing, stripeAcctId, paymentOption, servicePrice, receiptEmail }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || isSubmitting || isProcessing) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Create payment intent
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          stripeAcctId: stripeAcctId,
          paymentOption: paymentOption,
          servicePrice: servicePrice,
          receiptEmail: receiptEmail,
          metadata: {
            source: 'saga-health-lmn'
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const { clientSecret, paymentIntentId } = data;

      if (!clientSecret) {
        throw new Error('Failed to create payment intent - no client secret received');
      }

      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (stripeError) {
        setError(stripeError.message);
        onPaymentError(stripeError.message);
        setIsSubmitting(false);
      } else if (paymentIntent.status === 'succeeded') {
        // Note: Stripe automatically sends receipt emails when receipt_email is set on the payment intent
        // In test mode, receipts are NOT sent automatically - check Stripe Dashboard
        // In live mode, receipts are sent automatically when payment succeeds
        if (receiptEmail) {
          console.log('Payment succeeded. Receipt email was set to:', receiptEmail);
          console.log('Note: In test mode, Stripe does not automatically send receipt emails.');
          console.log('In live mode, Stripe will automatically send the receipt.');
        }
        
        // Keep isSubmitting true until parent handles success
        onPaymentSuccess(paymentIntentId, paymentIntent);
      }
    } catch (err) {
      const errorMessage = err.message || 'Payment failed';
      setError(errorMessage);
      onPaymentError(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Information *
        </label>
        <CardElement 
          options={CARD_ELEMENT_OPTIONS}
          className="p-3 border border-gray-300 rounded-lg"
        />
        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
      </div>
      
      <button
        type="submit"
        disabled={!stripe || isProcessing || isSubmitting}
        className={`w-full px-6 py-3 rounded-lg font-semibold text-white ${
          !stripe || isProcessing || isSubmitting
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isProcessing || isSubmitting ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  );
}
