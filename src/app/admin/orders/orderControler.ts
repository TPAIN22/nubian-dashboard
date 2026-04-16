import { axiosInstance } from "@/lib/axiosInstance";
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

export async function updateOrderStatus(
  orderId: string,
  status: AdminOrderStatus,
  token: string
) {
  try {
    const res = await axiosInstance.patch(
      `/orders/${orderId}/status`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  } catch (error) {
    logger.error("Error updating order status", {
      error: error instanceof Error ? error.message : "Unknown error",
      orderId,
      status,
    });
    throw error;
  }
}

export async function approveBankakPayment(orderId: string, token: string) {
  try {
    const res = await axiosInstance.patch(
      `/orders/${orderId}/payment/approve`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
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
  token: string
) {
  try {
    const res = await axiosInstance.patch(
      `/orders/${orderId}/payment/reject`,
      { reason },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
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
  token: string
) {
  try {
    const res = await axiosInstance.patch(
      `/orders/${orderId}/payment/status`,
      { paymentStatus },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  } catch (error) {
    logger.error("Error updating payment status", {
      error: error instanceof Error ? error.message : "Unknown error",
      orderId,
      paymentStatus,
    });
    throw error;
  }
}
