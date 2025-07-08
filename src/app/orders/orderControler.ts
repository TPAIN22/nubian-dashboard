import { axiosInstance } from "@/lib/axiosInstance";

export async function updateOrders(order: any, token: any) {
  try {
    // استخرج الـ ID من selectedRow
    const orderId = order.selectedRow?._id || order._id;
    
    // أضف الـ ID للـ payload إذا كان الـ backend يتوقعه في الـ body
    const payload: any = { id: orderId };
    if (order.status) payload.status = order.status;
    if (order.paymentStatus) payload.paymentStatus = order.paymentStatus;

    const orders = await axiosInstance.patch(
      `/orders/${orderId}/status`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return orders;
  } catch (error) {
    (error);
    return error;
  }
}