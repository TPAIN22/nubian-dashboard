import { axiosInstance } from '@/lib/axiosInstance';
import React, { Suspense } from 'react';
import { BrandsTable } from './brandsTable';
import { auth } from '@clerk/nextjs/server';




export type Merchant = {
  _id: string;
  clerkId: string;
  businessName: string;
  businessDescription?: string;
  businessEmail: string;
  businessPhone?: string;
  businessAddress?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  appliedAt: string;
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
    
    // Filter only approved merchants for brands
    return merchants.filter((m: Merchant) => m.status === "APPROVED");
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

export default async function BrandsPage() {
  const merchants = await getMerchants();
  
  return (
    <div className='flex flex-col gap-4 h-full sm:mx-12 mx-2'>
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl font-bold text-center'>العلامات التجارية</h1>
      </div>
      <Suspense fallback={<BrandsLoading />}>
        <BrandsTable merchants={merchants as Merchant[]} />
      </Suspense>
    </div>
  );
}
