import { auth } from '@clerk/nextjs/server';
import { axiosInstance } from '@/lib/axiosInstance';
import { MerchantDetailsView } from '@/components/merchants/MerchantDetailsView';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

interface PageProps {
  params: Promise<{
    merchantId: string;
  }>;
}

export type Merchant = {
  _id: string;
  clerkId: string;
  businessName: string;
  businessDescription?: string;
  businessEmail: string;
  businessPhone?: string;
  businessAddress?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  rejectionReason?: string;
  suspensionReason?: string;
  appliedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  suspendedAt?: string;
  createdAt: string;
  updatedAt: string;
};

async function getMerchant(merchantId: string): Promise<Merchant | null> {
  try {
    const { getToken } = await auth();
    const token = await getToken();
    
    if (!token) {
      return null;
    }

    const response = await axiosInstance.get(`/merchants/${merchantId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Handle different response structures
    let merchant: Merchant | null = null;
    
    if (response.data?.success && response.data?.data) {
      merchant = response.data.data;
    } else if (response.data) {
      merchant = response.data;
    }

    return merchant;
  } catch (error: any) {
    console.error('Error fetching merchant:', error);
    // If 404, return null to trigger notFound()
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { merchantId } = await params;
  const merchant = await getMerchant(merchantId);
  
  if (!merchant) {
    return {
      title: 'تاجر غير موجود',
    };
  }

  return {
    title: merchant.businessName,
    description: merchant.businessDescription || `تفاصيل التاجر: ${merchant.businessName}`,
  };
}

export default async function MerchantDetailsPage({ params }: PageProps) {
  const { merchantId } = await params;
  const merchant = await getMerchant(merchantId);

  if (!merchant) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 h-full sm:mx-12 mx-2 py-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/business/merchants" className="hover:text-foreground transition-colors">
          التجار
        </Link>
        <ArrowRight className="h-4 w-4 rotate-180" />
        <span className="text-foreground font-medium">{merchant.businessName}</span>
      </nav>

      {/* Back Button */}
      <div>
        <Link href="/business/merchants">
          <Button variant="ghost" className="gap-2">
            <ArrowRight className="h-4 w-4 rotate-180" />
            العودة إلى قائمة التجار
          </Button>
        </Link>
      </div>

      {/* Merchant Details */}
      <MerchantDetailsView merchant={merchant} />
    </div>
  );
}
