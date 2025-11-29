import stripe from '../stripe.js';

// Constants
const LMN_FEE = 20; // $20 LMN fee
const takeRate = 0.1; // 8% take rate

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

interface CreateCheckoutSessionParams {
  amount: number;
  currency?: string;
  metadata?: Record<string, any>;
  stripeAcctId?: string | null;
  paymentOption?: string; // 'lmn-only' | 'lmn-and-service' | 'service-only'
  servicePrice?: number;
  serviceName?: string | null;
  duration?: string | null;
  firstHealthCondition?: string | null;
  businessName?: string | null;
  businessAddress?: string | null;
  takeRate?: number | null;
  customerFirstName?: string | null;
  customerLastName?: string | null;
  receiptEmail?: string | null;
  successUrl: string;
  cancelUrl: string;
}

interface CheckoutSessionResult {
  sessionId: string;
  url: string;
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

  // Build payment intent parameters
  const paymentIntentParams: any = {
    amount: amountInCents,
    currency,
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  };

  // Add receipt email if provided (skip for service-only payments)
  if (receiptEmail && paymentOption !== 'service-only') {
    paymentIntentParams.receipt_email = receiptEmail.trim(); // Trim whitespace
    console.log('Setting receipt_email on payment intent:', receiptEmail.trim());
  } else if (paymentOption === 'service-only') {
    console.log('Skipping Stripe receipt for service-only payment (custom receipt will be sent instead)');
  } else {
    console.log('No receipt_email provided - receipts will not be sent');
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
  console.log('Payment intent receipt_email:', paymentIntent.receipt_email);
  console.log('Payment intent status:', paymentIntent.status);
  console.log('Has transfer_data:', !!paymentIntentParams.transfer_data);
  
  // Verify receipt_email was set correctly
  if (receiptEmail && !paymentIntent.receipt_email) {
    console.warn('⚠️ WARNING: receipt_email was provided but not set on payment intent!');
    console.warn('Possible reasons:');
    console.warn('  1. Stripe account email settings may be disabled');
    console.warn('  2. Email format may be invalid');
    console.warn('  3. Destination charges may have different receipt behavior');
  } else if (paymentIntent.receipt_email) {
    console.log('✅ receipt_email successfully set on payment intent');
    console.log('📧 Note: In test mode, receipts are only sent to verified test emails');
    console.log('📧 Note: With destination charges, receipts may be sent from connected account');
  }

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
  };
}

/**
 * Creates a Stripe Checkout Session with optional destination charge
 * @param params Checkout session parameters
 * @returns Checkout session result with session ID and URL
 */
export async function createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResult> {
  const { 
    amount, 
    currency = 'usd', 
    metadata = {}, 
    stripeAcctId, 
    paymentOption, 
    servicePrice, 
    serviceName,
    duration,
    firstHealthCondition,
    businessName,
    businessAddress,
    takeRate: providerTakeRate,
    customerFirstName,
    customerLastName,
    receiptEmail,
    successUrl,
    cancelUrl
  } = params;
  
  console.log('Creating checkout session for amount:', amount);
  console.log('Payment option:', paymentOption);
  console.log('Service price:', servicePrice);
  console.log('Service name received:', serviceName);
  console.log('Stripe account ID:', stripeAcctId);
  console.log('Receipt email:', receiptEmail);
  
  if (!amount || amount <= 0) {
    throw new Error('Invalid amount');
  }

  const amountInCents = Math.round(amount * 100);
  // Use provider's take_rate if provided, otherwise use default
  const effectiveTakeRate = providerTakeRate !== null && providerTakeRate !== undefined ? providerTakeRate : takeRate;

  // Build line items for checkout
  const lineItems: any[] = [];
  
  // Add line items based on payment option
  if (paymentOption === 'lmn-only') {
    lineItems.push({
      price_data: {
        currency: currency,
        product_data: {
          name: 'Letter of Medical Necessity (LMN)',
          description: 'LMN processing and generation fee',
        },
        unit_amount: 2000, // $20.00 in cents
      },
      quantity: 1,
    });
  } else if (paymentOption === 'lmn-and-service' && servicePrice) {
    // For LMN + Service, we'll create separate line items
    // The transfer will only apply to the service portion
    console.log('Service name:', serviceName);
    lineItems.push({
      price_data: {
        currency: currency,
        product_data: {
          name: 'Letter of Medical Necessity (LMN)',
          description: 'LMN processing and generation fee',
        },
        unit_amount: 2000, // $20.00 in cents
      },
      quantity: 1,
    });
    // Format product name: "[duration] [service name] for [health condition]"
    let productName = 'Appointment Payment';
    if (duration && serviceName && firstHealthCondition) {
      productName = `${duration} ${serviceName} for ${firstHealthCondition}`;
    } else if (duration && serviceName) {
      productName = `${duration} ${serviceName}`;
    } else if (serviceName) {
      productName = serviceName;
    }
    
    // Format description: "Provided by [business name], [address]"
    let productDescription = '';
    if (businessName && businessAddress) {
      productDescription = `Provided by ${businessName}, ${businessAddress}`;
    } else if (businessName) {
      productDescription = `Provided by ${businessName}`;
    }
    
    lineItems.push({
      price_data: {
        currency: currency,
        product_data: {
          name: productName,
        },
        unit_amount: Math.round(servicePrice * 100),
      },
      quantity: 1,
    });
  } else if (paymentOption === 'service-only') {
    // Service only
    // Format product name: "[duration] [service name] for [health condition]"
    let productName = 'Appointment Payment';
    if (duration && serviceName && firstHealthCondition) {
      productName = `${duration} ${serviceName} for ${firstHealthCondition}`;
    } else if (duration && serviceName) {
      productName = `${duration} ${serviceName}`;
    } else if (serviceName) {
      productName = serviceName;
    }
    
    // Format description: "Provided by [business name], [address]"
    let productDescription = '';
    if (businessName && businessAddress) {
      productDescription = `Provided by ${businessName}, ${businessAddress}`;
    } else if (businessName) {
      productDescription = `Provided by ${businessName}`;
    }
    
    lineItems.push({
      price_data: {
        currency: currency,
        product_data: {
          name: productName,
        },
        unit_amount: amountInCents,
      },
      quantity: 1,
    });
  } else {
    // Fallback
    lineItems.push({
      price_data: {
        currency: currency,
        product_data: {
          name: 'Payment',
        },
        unit_amount: amountInCents,
      },
      quantity: 1,
    });
  }

  // Create or retrieve customer with first and last name
  let customerId: string | undefined;
  if (customerFirstName && customerLastName) {
    try {
      const customerName = `${customerFirstName} ${customerLastName}`.trim();
      console.log('Creating/retrieving customer with name:', customerName);
      
      // Search for existing customer by email (if available)
      let existingCustomerId: string | null = null;
      if (receiptEmail) {
        const trimmedEmail = receiptEmail.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(trimmedEmail)) {
          const customers = await stripe.customers.list({
            email: trimmedEmail,
            limit: 1,
          });
          if (customers.data.length > 0) {
            const existingCustomer = customers.data[0];
            existingCustomerId = existingCustomer.id;
            // Update customer name if it's different
            if (existingCustomer.name !== customerName) {
              await stripe.customers.update(existingCustomer.id, {
                name: customerName,
              });
            }
          }
        }
      }
      
      if (existingCustomerId) {
        customerId = existingCustomerId;
        console.log('Using existing customer:', customerId);
      } else {
        // Create new customer
        const customer = await stripe.customers.create({
          name: customerName,
          email: receiptEmail?.trim() || undefined,
        });
        customerId = customer.id;
        console.log('Created new customer:', customerId);
      }
    } catch (error: any) {
      console.error('Error creating/retrieving customer:', error);
      // Continue without customer ID if creation fails
    }
  }

  // Build checkout session parameters
  const sessionParams: any = {
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: metadata,
  };

  // Add customer ID if available
  if (customerId) {
    sessionParams.customer = customerId;
    console.log('Setting customer ID on checkout session:', customerId);
  }

  // Add receipt email if provided (and customer not already set) - skip for service-only payments
  if (receiptEmail && !customerId && paymentOption !== 'service-only') {
    const trimmedEmail = receiptEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(trimmedEmail)) {
      sessionParams.customer_email = trimmedEmail;
      sessionParams.invoice_creation = {
        enabled: true,
      };
      console.log('Setting customer_email on checkout session:', trimmedEmail);
    } else {
      console.warn('⚠️ Invalid email format provided:', trimmedEmail);
    }
  } else if (receiptEmail && customerId && paymentOption !== 'service-only') {
    // If we have a customer ID, enable invoice creation (skip for service-only)
    sessionParams.invoice_creation = {
      enabled: true,
    };
  } else if (paymentOption === 'service-only') {
    console.log('Skipping Stripe receipt for service-only payment (custom receipt will be sent instead)');
  }

  // Handle different payment options for destination charges
  // Note: Add paymentOption and other details to metadata for retrieval later
  const enhancedMetadata = {
    ...metadata,
    paymentOption: paymentOption || 'lmn-only',
    serviceName: serviceName || '',
    duration: duration || '',
    firstHealthCondition: firstHealthCondition || '',
    businessName: businessName || '',
    businessAddress: businessAddress || '',
    servicePrice: servicePrice?.toString() || '',
  };

  if (paymentOption === 'lmn-only') {
    // LMN only: All money goes to platform, no destination charge
    sessionParams.metadata = enhancedMetadata;
    console.log('LMN only payment: All funds go to platform, no destination charge');
  } else if (paymentOption === 'lmn-and-service' && stripeAcctId && servicePrice) {
    // LMN + Service: $20 stays with platform, service amount goes to merchant with custom take rate
    const serviceAmountInCents = Math.round(servicePrice * 100);
    const platformFeeAmount = Math.round(serviceAmountInCents * effectiveTakeRate);
    const merchantReceivesAmount = serviceAmountInCents - platformFeeAmount;
    
    // Use payment_intent_data to set up destination charge
    // Only transfer the service portion (not the LMN fee)
    sessionParams.payment_intent_data = {
      transfer_data: {
        destination: stripeAcctId,
        amount: merchantReceivesAmount, // Transfer the service amount minus take rate fee
      },
      metadata: enhancedMetadata,
    };
    sessionParams.metadata = enhancedMetadata;
    
    console.log(`LMN + Service payment:`);
    console.log(`  Total amount: $${amount.toFixed(2)}`);
    console.log(`  LMN fee (platform): $${LMN_FEE.toFixed(2)}`);
    console.log(`  Service amount: $${servicePrice.toFixed(2)}`);
    console.log(`  Platform take (${(effectiveTakeRate * 100).toFixed(1)}% of service): $${(platformFeeAmount / 100).toFixed(2)}`);
    console.log(`  Merchant receives: $${(merchantReceivesAmount / 100).toFixed(2)}`);
    console.log(`  Platform total: $${((amountInCents - merchantReceivesAmount) / 100).toFixed(2)}`);
  } else if (paymentOption === 'service-only' && stripeAcctId) {
    // Service only: Full amount goes to merchant with custom take rate
    const applicationFeeAmount = Math.round(amountInCents * effectiveTakeRate);
    
    sessionParams.payment_intent_data = {
      transfer_data: {
        destination: stripeAcctId,
      },
      application_fee_amount: applicationFeeAmount,
      metadata: enhancedMetadata,
    };
    sessionParams.metadata = enhancedMetadata;
    
    console.log(`Service only payment: ${stripeAcctId} with ${(effectiveTakeRate * 100).toFixed(1)}% take rate (${applicationFeeAmount} cents)`);
  } else if (stripeAcctId) {
    // Fallback: If stripeAcctId is provided but no specific payment option, use default behavior
    const applicationFeeAmount = Math.round(amountInCents * effectiveTakeRate);
    sessionParams.payment_intent_data = {
      transfer_data: {
        destination: stripeAcctId,
      },
      application_fee_amount: applicationFeeAmount,
      metadata: enhancedMetadata,
    };
    sessionParams.metadata = enhancedMetadata;
    console.log(`Using destination charge: ${stripeAcctId} with ${(effectiveTakeRate * 100).toFixed(1)}% take rate (${applicationFeeAmount} cents)`);
  } else {
    sessionParams.metadata = enhancedMetadata;
    console.log('No stripeAcctId provided, creating standard checkout session');
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create(sessionParams);

  console.log('Checkout session created successfully:', session.id);
  console.log('Checkout session URL:', session.url);
  if (session.customer_email) {
    console.log('Customer email set:', session.customer_email);
  }

  return {
    sessionId: session.id,
    url: session.url!,
  };
}


