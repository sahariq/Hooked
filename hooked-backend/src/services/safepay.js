import crypto from 'crypto';

// Thin wrapper around Safepay's Checkout API.
// Docs: https://docs.safepay.pk  (Pakistani payment gateway — settles to a PKR bank account,
// accepts local + international Visa/Mastercard).
//
// You need a real Safepay merchant account to go live: set SAFEPAY_API_KEY, SAFEPAY_SECRET,
// and SAFEPAY_ENV=sandbox|production in your .env. Until then, createCheckoutSession() falls
// back to a mock session so the rest of the flow (order creation, confirmation page) can be
// built and tested without a live merchant account.

const SAFEPAY_BASE_URL = process.env.SAFEPAY_ENV === 'production'
  ? 'https://api.getsafepay.com'
  : 'https://sandbox.api.getsafepay.com';

export async function createCheckoutSession(order) {
  const apiKey = process.env.SAFEPAY_API_KEY;

  if (!apiKey) {
    // Mock mode: no Safepay credentials configured yet.
    console.warn('[safepay] No SAFEPAY_API_KEY set — returning a mock checkout session.');
    return {
      mock: true,
      checkoutUrl: `${process.env.CORS_ORIGIN?.split(',')[0] || 'http://localhost:5173'}/order/${order.id}/mock-pay`,
      tracker: `mock_${order.order_number}`,
    };
  }

  const res = await fetch(`${SAFEPAY_BASE_URL}/order/v1/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client: apiKey,
      amount: order.total_cents, // Safepay expects the smallest currency unit (paisa)
      currency: 'PKR',
      environment: process.env.SAFEPAY_ENV === 'production' ? 'production' : 'sandbox',
      order_id: order.order_number,
      source: 'custom',
      metadata: {
        order_number: order.order_number,
        customer_email: order.customer_email,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Safepay session creation failed: ${res.status} ${body}`);
  }

  const data = await res.json();
  return {
    mock: false,
    checkoutUrl: `${process.env.SAFEPAY_CHECKOUT_URL || 'https://sandbox.getsafepay.com/checkout'}?tracker=${data.data.tracker}`,
    tracker: data.data.tracker,
  };
}

// Verifies a Safepay webhook payload. Safepay signs webhooks with an HMAC-SHA256 signature
// in the `X-SFPY-Signature` header, computed over the raw request body using your webhook secret.
export function verifyWebhookSignature(rawBody, signatureHeader) {
  const secret = process.env.SAFEPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('[safepay] No SAFEPAY_WEBHOOK_SECRET set — skipping signature verification (dev only).');
    return true;
  }
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return expected === signatureHeader;
}
