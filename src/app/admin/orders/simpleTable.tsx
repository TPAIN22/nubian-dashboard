"use client";

import React, { useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { axiosInstance } from "@/lib/axiosInstance";

type SubOrder = {
  _id: string;
  merchantId: string;
  total: number;
  shippingFee: number;
  fulfillmentStatus: string;
  paymentStatus: string;
};

type Order = {
  _id: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  currency?: string;
  address?: {
    name?: string;
    city?: string;
    phone?: string;
    whatsapp?: string;
    street?: string;
  };
  proofUrl?: string;
  subOrders?: SubOrder[];
  createdAt?: string;
};

export function SimpleOrdersTable({ orders }: { orders: Order[] }) {
  const { getToken } = useAuth();

  const handleAction = useMemo(
    () => ({
      verify: async (orderId: string) => {
        const token = await getToken();
        await axiosInstance.post(`/orders/${orderId}/verify-transfer`, {}, { headers: { Authorization: `Bearer ${token}` } });
        window.location.reload();
      },
      reject: async (orderId: string) => {
        const token = await getToken();
        await axiosInstance.post(`/orders/${orderId}/reject-transfer`, {}, { headers: { Authorization: `Bearer ${token}` } });
        window.location.reload();
      },
    }),
    [getToken]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Order</th>
              <th className="px-4 py-3 text-left font-semibold">Payment</th>
              <th className="px-4 py-3 text-left font-semibold">Totals</th>
              <th className="px-4 py-3 text-left font-semibold">Address</th>
              <th className="px-4 py-3 text-left font-semibold">Proof</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders?.map((order) => (
              <tr key={order._id} className="border-t border-gray-100 align-top">
                <td className="px-4 py-3">
                  <div className="font-semibold">{order._id}</div>
                  <div className="text-xs text-gray-500">{order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-gray-800">{order.paymentMethod}</div>
                  <div className="text-xs text-gray-500">{order.paymentStatus}</div>
                </td>
                <td className="px-4 py-3">
                  <div>Subtotal: {order.subtotal} {order.currency || "SDG"}</div>
                  <div>Shipping: {order.shippingFee} {order.currency || "SDG"}</div>
                  <div className="font-semibold">Total: {order.total} {order.currency || "SDG"}</div>
                  {order.subOrders?.length ? (
                    <div className="mt-2 text-xs text-gray-600">
                      {order.subOrders.map((sub) => (
                        <div key={sub._id || sub.merchantId} className="mb-1">
                          <span className="font-medium">{sub.merchantId}</span> — {sub.total} | ship {sub.shippingFee} | {sub.fulfillmentStatus}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-xs text-gray-700">
                  {order.address?.name && <div>{order.address.name}</div>}
                  {order.address?.city && <div>{order.address.city}</div>}
                  {order.address?.street && <div>{order.address.street}</div>}
                  {order.address?.phone && <div>📞 {order.address.phone}</div>}
                  {order.address?.whatsapp && <div>💬 {order.address.whatsapp}</div>}
                </td>
                <td className="px-4 py-3">
                  {order.proofUrl ? (
                    <a href={order.proofUrl} className="text-blue-600 underline" target="_blank" rel="noreferrer">
                      View proof
                    </a>
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {order.paymentMethod === "BANKAK" ? (
                    <div className="flex gap-2">
                      <button
                        className="rounded bg-green-100 px-3 py-1 text-xs text-green-800"
                        onClick={() => handleAction.verify(order._id)}
                      >
                        Verify
                      </button>
                      <button
                        className="rounded bg-red-100 px-3 py-1 text-xs text-red-800"
                        onClick={() => handleAction.reject(order._id)}
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
