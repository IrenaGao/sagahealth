import stripe from '../stripe.js';

interface CreatePaymentIntentParams {
  amount: number;
  currency?: string;
  metadata?: Record<string, any>;
  stripeAcctId?: string | null;
  paymentOption?: string; // 'lmn-only' | 'lmn-and-service' | 'service-only'
  servicePrice?: number;
  receiptEmail?: string | null;
}

interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
}

interface ConfirmPaymentResult {
  success: boolean;
  status: string;
  amount?: number;
  currency?: string;
  error?: string;
}

/**
 * Creates a Stripe payment intent with optional destination charge
 * @param params Payment intent parameters
 * @returns Payment intent result with client secret and ID
 */
export async function createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
  const { amount, currency = 'usd', metadata = {}, stripeAcctId, paymentOption, servicePrice, receiptEmail } = params;
  
  console.log('Creating payment intent for amount:', amount);
  console.log('Payment option:', paymentOption);
  console.log('Service price:', servicePrice);
  console.log('Stripe account ID:', stripeAcctId);
  console.log('Receipt email:', receiptEmail);
  
  if (!amount || amount <= 0) {
    throw new Error('Invalid amount');
  }

  const amountInCents = Math.round(amount * 100);
  const LMN_FEE = 20; // $20 LMN fee
  const takeRate = 0.08; // 8% take rate

  // Build payment intent parameters
  const paymentIntentParams: any = {
    amount: amountInCents,
    currency,
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  };

  // Add receipt email if provided
  if (receiptEmail) {
    paymentIntentParams.receipt_email = receiptEmail;
  }

  // Handle different payment options
  if (paymentOption === 'lmn-only') {
    // LMN only: All money goes to platform, no destination charge
    console.log('LMN only payment: All funds go to platform, no destination charge');
  } else if (paymentOption === 'lmn-and-service' && stripeAcctId && servicePrice) {
    // LMN + Service: $20 stays with platform, service amount goes to merchant with 8% take rate
    // Note: When using transfer_data.amount, we cannot use application_fee_amount (they're mutually exclusive)
    // So we calculate the merchant's final amount (after 8% fee) and transfer that directly
    const serviceAmountInCents = Math.round(servicePrice * 100);
    const platformFeeAmount = Math.round(serviceAmountInCents * takeRate);
    const merchantReceivesAmount = serviceAmountInCents - platformFeeAmount;
    
    paymentIntentParams.transfer_data = {
      destination: stripeAcctId,
      amount: merchantReceivesAmount, // Transfer the service amount minus 8% fee
    };
    // Do NOT set application_fee_amount when using transfer_data.amount
    
    console.log(`LMN + Service payment:`);
    console.log(`  Total amount: $${amount.toFixed(2)}`);
    console.log(`  LMN fee (platform): $${LMN_FEE.toFixed(2)}`);
    console.log(`  Service amount: $${servicePrice.toFixed(2)}`);
    console.log(`  Platform take (8% of service): $${(platformFeeAmount / 100).toFixed(2)}`);
    console.log(`  Merchant receives: $${(merchantReceivesAmount / 100).toFixed(2)}`);
    console.log(`  Platform total: $${((amountInCents - merchantReceivesAmount) / 100).toFixed(2)}`);
  } else if (paymentOption === 'service-only' && stripeAcctId) {
    // Service only: Full amount goes to merchant with 8% take rate
    const applicationFeeAmount = Math.round(amountInCents * takeRate);
    
    paymentIntentParams.transfer_data = {
      destination: stripeAcctId,
    };
    paymentIntentParams.application_fee_amount = applicationFeeAmount;
    
    console.log(`Service only payment: ${stripeAcctId} with ${takeRate * 100}% take rate (${applicationFeeAmount} cents)`);
  } else if (stripeAcctId) {
    // Fallback: If stripeAcctId is provided but no specific payment option, use default behavior
    const applicationFeeAmount = Math.round(amountInCents * takeRate);
    paymentIntentParams.transfer_data = {
      destination: stripeAcctId,
    };
    paymentIntentParams.application_fee_amount = applicationFeeAmount;
    console.log(`Using destination charge: ${stripeAcctId} with ${takeRate * 100}% take rate (${applicationFeeAmount} cents)`);
  } else {
    console.log('No stripeAcctId provided, creating standard payment intent');
  }

  // Create payment intent
  const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

  console.log('Payment intent created successfully:', paymentIntent.id);

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
  };
}

/**
 * Updates payment intent with receipt email (Stripe will send receipt automatically)
 * Note: In test mode, Stripe does not automatically send receipt emails.
 * Receipts are only sent automatically in live mode when receipt_email is set.
 * @param paymentIntentId The payment intent ID
 * @param receiptEmail The email address to send receipt to
 * @returns Success status
 */
export async function updateReceiptEmail(paymentIntentId: string, receiptEmail: string): Promise<boolean> {
  try {
    if (!receiptEmail) {
      console.log('No receipt email provided for payment intent:', paymentIntentId);
      return false;
    }

    // Update the payment intent with receipt_email
    // Stripe will automatically send the receipt when payment succeeds (in live mode)
    await stripe.paymentIntents.update(paymentIntentId, {
      receipt_email: receiptEmail,
    });
    
    console.log(`Receipt email set to: ${receiptEmail} for payment intent: ${paymentIntentId}`);
    console.log('Note: Receipts are only sent automatically in live mode, not in test mode.');
    return true;
  } catch (error: any) {
    console.error('Failed to update receipt email:', error.message);
    return false;
  }
}

/**
 * Confirms/retrieves a payment intent status
 * @param paymentIntentId The payment intent ID to check
 * @returns Payment confirmation result
 */
export async function confirmPayment(paymentIntentId: string): Promise<ConfirmPaymentResult> {
  if (!paymentIntentId) {
    throw new Error('Payment intent ID required');
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  
  if (paymentIntent.status === 'succeeded') {
    // Log receipt email status
    if (paymentIntent.receipt_email) {
      console.log(`Payment succeeded. Receipt email is set to: ${paymentIntent.receipt_email}`);
      console.log('Note: Stripe automatically sends receipts in live mode when receipt_email is set.');
      console.log('In test mode, receipts are not sent automatically. Check Stripe Dashboard to verify.');
    } else {
      console.log('Payment succeeded but no receipt_email is set on the payment intent.');
    }
    
    return {
      success: true,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100, // Convert back from cents
      currency: paymentIntent.currency,
    };
  } else {
    return {
      success: false,
      status: paymentIntent.status,
      error: 'Payment not completed',
    };
  }
}

