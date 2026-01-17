import { auth } from '@clerk/nextjs/server';
import { axiosInstance } from '@/lib/axiosInstance';
import { ProductDetails, Product } from '@/components/products/ProductDetails';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
export const runtime = 'edge';


interface PageProps {
  params: Promise<{
    productId: string;
  }>;
}

async function getProduct(productId: string): Promise<Product | null> {
  try {
    const { getToken } = await auth();
    const token = await getToken();
    
    if (!token) {
      return null;
    }

    const response = await axiosInstance.get(`/products/${productId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Handle different response structures
    let product: Product | null = null;
    
    if (response.data?.success && response.data?.data) {
      product = response.data.data;
    } else if (response.data) {
      product = response.data;
    }

    return product;
  } catch (error: any) {
    console.error('Error fetching product:', error);
    // If 404, return null to trigger notFound()
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { productId } = await params;
  const product = await getProduct(productId);
  
  if (!product) {
    return {
      title: 'منتج غير موجود',
    };
  }

  return {
    title: product.name,
    description: product.description || `تفاصيل المنتج: ${product.name}`,
  };
}

export default async function ProductDetailsPage({ params }: PageProps) {
  const { productId } = await params;
  const product = await getProduct(productId);

  if (!product) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 h-full sm:mx-12 mx-2 py-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/business/products" className="hover:text-foreground transition-colors">
          المنتجات
        </Link>
        <ArrowRight className="h-4 w-4 rotate-180" />
        <span className="text-foreground font-medium">{product.name}</span>
      </nav>

      {/* Back Button */}
      <div>
        <Link href="/business/products">
          <Button variant="ghost" className="gap-2">
            <ArrowRight className="h-4 w-4 rotate-180" />
            العودة إلى قائمة المنتجات
          </Button>
        </Link>
      </div>

      {/* Product Details */}
      <ProductDetails 
        product={product} 
        showActions={true}
        editUrl={`/business/products/${product._id}/edit`}
      />
    </div>
  );
}
