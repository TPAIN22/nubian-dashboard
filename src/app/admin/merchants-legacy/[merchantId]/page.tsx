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

/**
 * `GET /merchants/:id` returns the raw Merchant document — model field names,
 * lowercase status enum. See `merchant.model.js`.
 */
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
  revisionNotes?: string;
  suspensionReason?: string;
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
    title: merchant.storeName,
    description: merchant.description || `تفاصيل التاجر: ${merchant.storeName}`,
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
        <Link href="/admin/merchants-legacy" className="hover:text-foreground transition-colors">
          التجار
        </Link>
        <ArrowRight className="h-4 w-4 rotate-180" />
        <span className="text-foreground font-medium">{merchant.storeName}</span>
      </nav>

      {/* Back Button */}
      <div>
        <Link href="/admin/merchants-legacy">
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
