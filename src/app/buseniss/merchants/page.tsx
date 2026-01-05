import { axiosInstance } from '@/lib/axiosInstance';
import React from 'react';
import { MerchantsTable } from './merchantsTable';
import { auth } from '@clerk/nextjs/server';

export default async function MerchantsPage() {
  const { getToken } = await auth();
  const token = await getToken();
  
  const merchants = await axiosInstance.get("/merchants", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then(res => res.data).catch(() => []);

  return (
    <div>
      <h1 className="text-2xl font-bold sm:mx-12 mx-2">التجار</h1>
      <div className="flex flex-col gap-4 h-full sm:mx-12 mx-2">
        <MerchantsTable merchants={merchants} />
      </div>
    </div>
  );
}

