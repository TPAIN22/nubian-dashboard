import React from "react";
import { auth } from "@clerk/nextjs/server";
import { axiosInstance } from "@/lib/axiosInstance";
import { SimpleOrdersTable } from "./simpleTable";
import OrdersTable, { DataTable } from "./ordersTable";
import { Order } from "./types";
export default async function Page() {
  const { getToken } = await auth();
  const token = await getToken();
  const orders = await axiosInstance
    .get("/orders/admin", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => res.data);

  return (
    <div>
      <h1 className="text-2xl font-bold sm:mx-12 mx-2">الطلبات</h1>
      <div className="flex flex-col gap-4 h-full sm:mx-12 mx-2">
        <DataTable orders={orders as unknown as Order[]} />
      </div>
    </div>
  );
}