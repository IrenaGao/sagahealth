import stripe from '../stripe.js';


interface CreateCheckoutSessionParams {
  amount: number;
  currency?: string;
  metadata?: Record<string, any>;
  serviceName?: string | null;
  firstHealthCondition?: string | null;
  businessName?: string | null;
  businessAddress?: string | null;
  customerFirstName?: string | null;
  customerLastName?: string | null;
  successUrl: string;
  cancelUrl: string;
}

interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

/**
 * Creates a Stripe Checkout Session
 * @param params Checkout session parameters
 * @returns Checkout session result with session ID and URL
 */
export async function createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResult> {
  const {
    amount,
    currency = 'usd',
    metadata = {},
    serviceName,
    firstHealthCondition,
    businessName,
    businessAddress,
    customerFirstName,
    customerLastName,
    successUrl,
    cancelUrl
  } = params;

  console.log('Creating checkout session for amount:', amount);
  console.log('Service name received:', serviceName);

  if (!amount || amount <= 0) {
    throw new Error('Invalid amount');
  }

  // LMN-only: fixed $20 line item, all funds go to platform
  const lineItems: any[] = [
    {
      price_data: {
        currency: currency,
        product_data: {
          name: 'Letter of Medical Necessity (LMN)',
          description: 'LMN processing and generation fee',
        },
        unit_amount: 2000, // $20.00 in cents
      },
      quantity: 1,
    },
  ];

  // Build checkout session parameters
  const sessionParams: any = {
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: metadata,
  };

  // Add customer name if provided (Stripe collects email during checkout)
  if (customerFirstName && customerLastName) {
    try {
      const customer = await stripe.customers.create({
        name: `${customerFirstName} ${customerLastName}`.trim(),
      });
      sessionParams.customer = customer.id;
      console.log('Created customer:', customer.id);
    } catch (error: any) {
      console.error('Error creating customer:', error);
    }
  }

  // LMN-only: all funds go to platform, no destination charge
  const enhancedMetadata = {
    ...metadata,
    paymentOption: 'lmn-only',
    serviceName: serviceName || '',
    firstHealthCondition: firstHealthCondition || '',
    businessName: businessName || '',
    businessAddress: businessAddress || '',
  };

  sessionParams.metadata = enhancedMetadata;
  console.log('LMN only payment: All funds go to platform, no destination charge');

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


