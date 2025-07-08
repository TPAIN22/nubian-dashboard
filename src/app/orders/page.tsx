import Side from '@/components/ui/side-bar-provider'
import React, { Suspense } from 'react'
import { axiosInstance } from '@/lib/axiosInstance'
import { auth } from '@clerk/nextjs/server' 
import { DataTable } from './ordersTable'

const page = async () => {
  const {getToken} = await auth(); 
    const token = await getToken();    
  const orders= await axiosInstance.get("/orders/admin", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then(res => res.data);
  return (
    <div>
      <h1 className='text-2xl font-bold mx-12'>الطلبات</h1>
    <div className='flex flex-col gap-4 h-full mx-12'>
      <Suspense>
      <DataTable orders={orders}/>
      </Suspense>
    </div>
    </div>
  )
}

export default page