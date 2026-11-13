import { pool } from '../db/pool.js';
import { withTransaction } from '../db/tx.js';
import { bankDeadlineHours, cardHoldMinutes } from './paymentConfig.js';

/**
 * Cancels an order exactly once and returns its items to stock.
 * Safe to call repeatedly (webhook retries, double clicks, the expiry job): only the first call changes anything.
 */
export async function cancelOrder(orderId, paymentStatus = null) {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `UPDATE orders SET status = 'cancelled', payment_status = COALESCE($2, payment_status), updated_at = now()
       WHERE id = $1 AND status <> 'cancelled' RETURNING id`,
      [orderId, paymentStatus]
    );
    if (!rows[0]) return false;
    await client.query(
      `UPDATE products p SET stock = p.stock + oi.total, updated_at = now()
       FROM (SELECT product_id, SUM(qty) AS total FROM order_items WHERE order_id = $1 GROUP BY product_id) oi
       WHERE p.id = oi.product_id`,
      [orderId]
    );
    return true;
  });
}

/**
 * Releases the stock held by orders that were never paid:
 *  - card orders left unpaid longer than CARD_HOLD_MINUTES (customer closed the tab at the payment page)
 *  - bank-transfer orders unpaid after BANK_PAYMENT_HOURS, UNLESS the customer already said they paid
 *    (those wait for you to check your bank and decide)
 */
export async function expireUnpaidOrders() {
  const { rows } = await pool.query(
    `SELECT id FROM orders
     WHERE status = 'pending' AND payment_status = 'unpaid' AND (
       (payment_method = 'card' AND created_at < now() - make_interval(mins => $1::int))
       OR
       (payment_method = 'bank_transfer' AND payment_claimed_at IS NULL
          AND created_at < now() - make_interval(hours => $2::int))
     )
     LIMIT 100`,
    [cardHoldMinutes(), bankDeadlineHours()]
  );
  let cancelled = 0;
  for (const { id } of rows) {
    if (await cancelOrder(id)) cancelled += 1;
  }
  return cancelled;
}

/** Runs the expiry check every 10 minutes (and once shortly after boot). */
export function startOrderExpiry() {
  const run = async () => {
    try {
      const n = await expireUnpaidOrders();
      if (n > 0) console.log(`Released ${n} unpaid order(s) back to stock`);
    } catch (err) {
      console.error('Order expiry job failed', err);
    }
  };
  setTimeout(run, 30_000).unref();
  setInterval(run, 10 * 60 * 1000).unref();
}
