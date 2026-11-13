// Emails for the bank-transfer flow. Uses Resend's HTTP API directly (no extra package).
// With RESEND_API_KEY blank (development) emails are printed to the console instead of sent.
import { bankDetails, bankDeadlineHours, frontendUrl } from './paymentConfig.js';
import { money } from '../utils.js';

const FROM = process.env.RESEND_FROM_EMAIL || 'Hooked <onboarding@resend.dev>';

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function send({ to, subject, html }) {
  if (!to) return;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email not sent: no RESEND_API_KEY] to=${to} | ${subject}`);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
  if (!res.ok) throw new Error(`Resend responded ${res.status}`);
}

const wrap = (inner) =>
  `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#4a3540;line-height:1.55">${inner}
   <p style="margin-top:28px;color:#8a7a80;font-size:12px">With love, Hooked ♡</p></div>`;

// NOTE: confirm this path matches your order-confirmation route in the frontend router.
const orderLink = (order, token) =>
  `${frontendUrl()}/order/${encodeURIComponent(order.id)}${token ? `?token=${encodeURIComponent(token)}` : ''}`;

/** Sent right after a bank-transfer order is placed. */
export async function sendBankTransferInstructions(order, token) {
  const b = bankDetails();
  const deadline = new Date(new Date(order.created_at).getTime() + bankDeadlineHours() * 3600e3);
  const row = (label, value) =>
    value ? `<tr><td style="padding:4px 14px 4px 0;color:#8a7a80">${esc(label)}</td><td><strong>${esc(value)}</strong></td></tr>` : '';
  await send({
    to: order.customer_email,
    subject: `Order ${order.order_number}: how to pay by bank transfer`,
    html: wrap(`
      <h2>Thank you, ${esc(order.customer_name)}!</h2>
      <p>Your order <strong>${esc(order.order_number)}</strong> is reserved. To confirm it, please send
      <strong>Rs ${money(order.total_cents).toFixed(2)}</strong> to:</p>
      <table>${row('Account title', b.accountTitle)}${row('Bank', b.bankName)}${row('IBAN', b.iban)}
      ${row('Account no.', b.accountNumber)}${row('SWIFT', b.swift)}${row('Payment reference', order.order_number)}</table>
      ${b.notes ? `<p>${esc(b.notes)}</p>` : ''}
      <p>Please pay by <strong>${esc(deadline.toUTCString())}</strong>, then tell me you've sent it on
      <a href="${esc(orderLink(order, token))}">your order page</a>. Unpaid orders are released after the deadline.</p>`),
  });
}

/** Sent when you mark a bank-transfer order as paid. */
export async function sendPaymentReceived(order) {
  await send({
    to: order.customer_email,
    subject: `Payment received for order ${order.order_number}`,
    html: wrap(`
      <h2>Payment received, thank you!</h2>
      <p>I've received your payment for order <strong>${esc(order.order_number)}</strong>. I'm getting started on your
      handmade pieces now, and I'll let you know when they ship.</p>`),
  });
}

/** Tells the shop owner a customer says they've paid, so there's something to check in the bank app. */
export async function notifyPaymentClaimed(order) {
  await send({
    to: process.env.ADMIN_EMAIL,
    subject: `Customer says they paid: ${order.order_number}`,
    html: wrap(`
      <p><strong>${esc(order.customer_name)}</strong> says they've paid order <strong>${esc(order.order_number)}</strong>
      (Rs ${money(order.total_cents).toFixed(2)}).</p>
      <p>Reference they gave: <strong>${esc(order.payment_reference)}</strong>${order.payment_sender ? `<br>Sender name: ${esc(order.payment_sender)}` : ''}</p>
      <p>Check your bank app. If the money is there, mark the order as <em>paid</em> in the admin.</p>`),
  });
}
