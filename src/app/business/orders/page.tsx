import { axiosInstance } from '@/lib/axiosInstance';
import React from 'react';
import { DataTable } from './ordersTable';
import { auth } from '@clerk/nextjs/server';

export default async function Page() {
  const {getToken} = await auth(); 
    const token = await getToken();    
  const orders= await axiosInstance.get("/orders/admin", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then(res => res.data);

  return (
    <div>
      <h1 className="text-2xl font-bold sm:mx-12 mx-2">الطلبات</h1>
      <div className="flex flex-col gap-4 h-full sm:mx-12 mx-2">
        <DataTable orders={orders} />
      </div>
    </div>
  );
}