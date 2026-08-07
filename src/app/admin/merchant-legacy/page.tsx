import { axiosInstance } from '@/lib/axiosInstance';
import React, { Suspense } from 'react';
import { BrandsTable } from './brandsTable';
import { auth } from '@clerk/nextjs/server';




/** The raw Merchant document — model field names, lowercase status enum. */
export type Merchant = {
  _id: string;
  userId: string;
  storeName: string;
  ownerName?: string;
  description?: string;
  email: string;
  phone?: string;
  city?: string;
  logoUrl?: string;
  status: "pending" | "approved" | "rejected" | "needs_revision" | "suspended";
  rejectionReason?: string;
  approvedAt?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
};

async function getMerchants() {
  try {
    const { getToken } = await auth();
    const token = await getToken();
    
    const response = await axiosInstance.get("/merchants", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    // Handle different response structures
    let merchants = [];
    
    if (response.data?.success && Array.isArray(response.data?.data)) {
      merchants = response.data.data;
    } else if (Array.isArray(response.data?.merchants)) {
      merchants = response.data.merchants;
    } else if (Array.isArray(response.data)) {
      merchants = response.data;
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      merchants = response.data.data;
    }
    
    // Filter only approved merchants for brands. The enum is lowercase — the
    // old "APPROVED" comparison matched nothing, so this table was always empty.
    return merchants.filter((m: Merchant) => m.status?.toLowerCase() === "approved");
  } catch (error: any) {
    return [];
  }
}

function BrandsLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-lg text-muted-foreground">جاري التحميل...</div>
    </div>
  );
}

import { PageHeader } from "@/components/dashboard/PageHeader";

export default async function BrandsPage() {
  const merchants = await getMerchants();
  
  return (
    <div className="container max-w-7xl mx-auto px-6 py-8 space-y-8 animate-in fade-in duration-500">
      <PageHeader title="العلامات التجارية" description="إدارة قائمة التجار المعتمدة." />
      <Suspense fallback={<BrandsLoading />}>
        <BrandsTable merchants={merchants as Merchant[]} />
      </Suspense>
    </div>
  );
}
