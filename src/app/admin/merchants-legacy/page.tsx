import { axiosInstance } from '@/lib/axiosInstance';
import React from 'react';
import { MerchantsTable } from './merchantsTable';
import { auth } from '@clerk/nextjs/server';




import { PageHeader } from "@/components/dashboard/PageHeader";

export default async function MerchantsPage() {
  const { getToken } = await auth();
  const token = await getToken();
  
  const merchants = await axiosInstance.get("/merchants", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then(res => {
    // Handle standardized response format: { success: true, data: [...], message: "..." }
    return res.data?.data || res.data || [];
  }).catch(() => []);

  return (
    <div className="container max-w-7xl mx-auto px-6 py-8 space-y-8 animate-in fade-in duration-500">
      <PageHeader title="طلبات التجار" description="مراجعة طلبات انضمام التجار الجدد." />
      <MerchantsTable merchants={merchants} />
    </div>
  );
}

