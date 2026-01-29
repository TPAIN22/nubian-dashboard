import { Metadata } from "next";
import { getProductServer } from "@/lib/serverApi";
import ProductDetailClient from "./ProductDetailClient";
import ProductSchema from "@/components/shop/ProductSchema";

const baseUrl = "https://nubian-sd.store";

/**
 * Generate dynamic metadata for SEO
 * This runs on the server and provides unique title/description per product
 */
export async function generateMetadata({
   params
}: {
   params: Promise<{ id: string }>
}): Promise<Metadata> {
   const { id } = await params;
   const product = await getProductServer(id);

   if (!product) {
      return {
         title: "المنتج غير موجود | Product Not Found",
         description: "عذراً، المنتج الذي تبحث عنه غير موجود. تصفح منتجات نوبيان الأخرى.",
         robots: { index: false, follow: true },
      };
   }

   // Build SEO-optimized title and description
   const title = `${product.name} | شراء من نوبيان Nubian`;
   const description = product.description?.slice(0, 155) ||
      `اشترِ ${product.name} من نوبيان - أفضل متجر إلكتروني في السودان. شحن سريع وآمن.`;
   const image = product.images?.[0] || `${baseUrl}/nubi.png`;

   // Get category name if available
   const categoryName = product.category && typeof product.category === 'object' && 'name' in product.category
      ? product.category.name
      : '';

   return {
      title,
      description,
      keywords: [
         product.name,
         "نوبيان",
         "Nubian",
         "شراء",
         "تسوق",
         "السودان",
         "متجر إلكتروني",
         categoryName,
      ].filter(Boolean),
      openGraph: {
         title,
         description,
         url: `${baseUrl}/shop/product/${id}`,
         type: "website",
         siteName: "نوبيان | Nubian",
         locale: "ar_SD",
         images: [
            {
               url: image,
               width: 800,
               height: 600,
               alt: product.name,
            }
         ],
      },
      twitter: {
         card: "summary_large_image",
         title,
         description,
         images: [image],
         creator: "@nubian_sd",
      },
      alternates: {
         canonical: `${baseUrl}/shop/product/${id}`,
      },
      robots: {
         index: true,
         follow: true,
         googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
         },
      },
   };
}

/**
 * Product detail page - Server Component wrapper
 * Fetches product data server-side for SEO and passes to client component
 */
export default async function ProductPage({
   params
}: {
   params: Promise<{ id: string }>
}) {
   const { id } = await params;
   const product = await getProductServer(id);

   return (
      <>
         {/* Structured Data for SEO - Product Schema */}
         {product && <ProductSchema product={product} />}

         {/* Interactive Client Component */}
         <ProductDetailClient productId={id} initialProduct={product} />
      </>
   );
}
