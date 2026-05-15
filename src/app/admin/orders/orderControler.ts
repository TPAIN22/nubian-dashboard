/**
 * Admin order mutations. All requests go through Next route handlers
 * (/api/orders/...) which proxy to the backend. This keeps the bearer
 * token on the server and makes the dashboard consistent with the rest
 * of the merchant flow.
 */

import logger from "@/lib/logger";

export type AdminOrderStatus =
  | "PENDING"
  | "AWAITING_PAYMENT_CONFIRMATION"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "PAYMENT_FAILED";

export type AdminPaymentStatus =
  | "UNPAID"
  | "PENDING_CONFIRMATION"
  | "PAID"
  | "REJECTED"
  | "FAILED";

// Generates a per-attempt idempotency key. crypto.randomUUID is available in
// every modern browser; fall back to a timestamp+random string for older
// runtimes (test envs, embedded webviews) so the helper never crashes.
function newIdempotencyKey(prefix: string, orderId: string) {
  const uuid =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}:${orderId}:${uuid}`;
}

async function patch<T = unknown>(
  url: string,
  body: unknown,
  idempotencyKey: string
): Promise<T> {
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(body),
  });
  // Authproxy returns JSON for both success and error shapes; surface the
  // backend's message when the upstream rejects so callers can show it.
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data as any)?.message || `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

export async function updateOrderStatus(
  orderId: string,
  status: AdminOrderStatus,
  // `_token` is kept in the signature for backwards compatibility with
  // existing callers — the proxy attaches auth on the server now.
  _token?: string,
  idempotencyKey: string = newIdempotencyKey("order-status", orderId)
) {
  try {
    return await patch(
      `/api/orders/${encodeURIComponent(orderId)}/status`,
      { status },
      idempotencyKey
    );
  } catch (error) {
    logger.error("Error updating order status", {
      error: error instanceof Error ? error.message : "Unknown error",
      orderId,
      status,
    });
    throw error;
  }
}

export async function approveBankakPayment(
  orderId: string,
  _token?: string,
  idempotencyKey: string = newIdempotencyKey("payment-approve", orderId)
) {
  try {
    return await patch(
      `/api/orders/${encodeURIComponent(orderId)}/payment/approve`,
      {},
      idempotencyKey
    );
  } catch (error) {
    logger.error("Error approving bankak payment", {
      error: error instanceof Error ? error.message : "Unknown error",
      orderId,
    });
    throw error;
  }
}

export async function rejectBankakPayment(
  orderId: string,
  reason: string,
  _token?: string,
  idempotencyKey: string = newIdempotencyKey("payment-reject", orderId)
) {
  try {
    return await patch(
      `/api/orders/${encodeURIComponent(orderId)}/payment/reject`,
      { reason },
      idempotencyKey
    );
  } catch (error) {
    logger.error("Error rejecting bankak payment", {
      error: error instanceof Error ? error.message : "Unknown error",
      orderId,
      reason,
    });
    throw error;
  }
}

export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: AdminPaymentStatus,
  _token?: string,
  idempotencyKey: string = newIdempotencyKey("payment-status", orderId)
) {
  try {
    return await patch(
      `/api/orders/${encodeURIComponent(orderId)}/payment/status`,
      { paymentStatus },
      idempotencyKey
    );
  } catch (error) {
    logger.error("Error updating payment status", {
      error: error instanceof Error ? error.message : "Unknown error",
      orderId,
      paymentStatus,
    });
    throw error;
  }
}
