// Order confirmation / receipt emails via Resend (https://resend.com).
// Set RESEND_API_KEY and RESEND_FROM_EMAIL in .env to send real emails.
// Without a key, emails are just logged to the console so the flow can be built/tested locally.

const RESEND_URL = 'https://api.resend.com/emails';

async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'Hooked <orders@hookedcrochet.com>';

  if (!apiKey) {
    console.log(`\n[email:mock] To: ${to}\n[email:mock] Subject: ${subject}\n[email:mock] (set RESEND_API_KEY to send for real)\n`);
    return { mock: true };
  }

  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    console.error('[email] Resend request failed:', await res.text());
    return { mock: false, error: true };
  }
  return { mock: false, error: false };
}

export async function sendOrderConfirmationEmail(order, items) {
  const currency = order.display_currency || 'PKR';
  const total = order.display_total != null ? Number(order.display_total).toFixed(2) : (order.total_cents / 100).toFixed(2);

  const itemRows = items.map((i) =>
    `<tr><td style="padding:8px 0;">${i.product_name}${i.color ? ` (${i.color})` : ''} × ${i.qty}</td>
     <td style="padding:8px 0; text-align:right;">Rs ${((i.price_cents * i.qty) / 100).toFixed(2)}</td></tr>`
  ).join('');

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #4A3540;">
      <h1 style="font-size: 22px;">Thank you, ${order.customer_name.split(' ')[0]}! 🎀</h1>
      <p>Your order <strong>${order.order_number}</strong> is confirmed.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">${itemRows}</table>
      <p style="font-weight: 600;">Total: ${currency} ${total}</p>
      <p style="color: #7a7161; font-size: 13px;">
        Payment method: ${order.payment_method === 'cod' ? 'Cash on Delivery' : 'Card (Safepay)'}<br/>
        We'll email you again once your order ships.
      </p>
    </div>`;

  return sendEmail({ to: order.customer_email, subject: `Order confirmed — ${order.order_number}`, html });
}

export async function sendCustomOrderAckEmail(request) {
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #4A3540;">
      <h1 style="font-size: 22px;">Got your request, ${request.name.split(' ')[0]}! ✂️</h1>
      <p>Thanks for reaching out about a custom piece. We'll review your request and follow up with a quote within 2 business days.</p>
      <p style="color:#7a7161; font-size: 13px;">Your note: "${request.message}"</p>
    </div>`;
  return sendEmail({ to: request.email, subject: 'We got your custom order request — Hooked', html });
}
