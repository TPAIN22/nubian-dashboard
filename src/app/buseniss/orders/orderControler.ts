import { axiosInstance } from "@/lib/axiosInstance";
import logger from "@/lib/logger";

// Define interfaces for type safety
interface OrderRow {
  _id: string;
  status?: string;
  paymentStatus?: string;
}

interface Order {
  selectedRow?: OrderRow;
  _id?: string;
  status?: string;
  paymentStatus?: string;
}

interface OrderUpdatePayload {
  id: string;
  status?: string;
  paymentStatus?: string;
}

interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

export async function updateOrders(order: Order, token: string): Promise<ApiResponse> {
  try {
    // استخرج الـ ID من selectedRow
    const orderId = order.selectedRow?._id || order._id;
    
    if (!orderId) {
      throw new Error("Order ID is required");
    }
    
    // أضف الـ ID للـ payload إذا كان الـ backend يتوقعه في الـ body
    const payload: OrderUpdatePayload = { id: orderId };
    if (order.status) payload.status = order.status;
    if (order.paymentStatus) payload.paymentStatus = order.paymentStatus;

    const orders = await axiosInstance.patch<ApiResponse>(
      `/orders/${orderId}/status`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return orders.data;
  } catch (error) {
    logger.error("Error updating order", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}