/**
 * Category listing.
 *
 * `GET /products?category=` resolves the whole subtree on the backend — a
 * parent department returns its children's products too — so linking a
 * top-level category from the homepage grid lands on a full department
 * rather than the handful of items filed directly against the parent.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductGrid } from "@/components/storefront/ProductGrid";
import { Pagination } from "@/components/storefront/Pagination";
import { PageIntro, EmptyState } from "@/components/storefront/PageIntro";
import { Container } from "@/components/storefront/Section";
import { StoreButton } from "@/components/storefront/StoreButton";
import { getCategory, getProducts } from "@/lib/storefront/api";
import { routes } from "@/lib/storefront/routes";

const baseUrl = "https://nubian-sd.com";

export const revalidate = 300;

type Params = {
  params: Promise<{ categoryId: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}): Promise<Metadata> {
  const { categoryId } = await params;
  const category = await getCategory(categoryId);
  if (!category) return { title: "القسم غير متاح" };

  const description = category.description
    ? category.description.replace(/\s+/g, " ").slice(0, 160)
    : `تصفّح منتجات ${category.name} على نوبيان.`;

  return {
    title: category.name,
    description,
    alternates: { canonical: `${baseUrl}${routes.category(category.id)}` },
    openGraph: {
      title: `${category.name} | نوبيان`,
      description,
      url: `${baseUrl}${routes.category(category.id)}`,
      type: "website",
      images: category.image ? [{ url: category.image, alt: category.name }] : undefined,
    },
  };
}

function toPage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 500) : 1;
}

export default async function CategoryPage({ params, searchParams }: Params) {
  const { categoryId } = await params;
  const page = toPage((await searchParams).page);

  const category = await getCategory(categoryId);
  if (!category) notFound();

  const { products, pagination } = await getProducts({
    category: category.id,
    page,
    limit: 24,
  });

  return (
    <>
      <PageIntro
        crumbs={[
          { label: "الرئيسية", href: routes.home() },
          { label: "كل المنتجات", href: routes.shop() },
          { label: category.name },
        ]}
        title={category.name}
        description={category.description}
      />

      <Container className="pb-20 md:pb-28">
        {products.length > 0 ? (
          <>
            <ProductGrid products={products} priorityCount={4} headingLevel={2} />
            <Pagination
              pagination={pagination}
              hrefFor={(target) => routes.category(category.id, { page: target })}
            />
          </>
        ) : (
          <EmptyState
            title="لا توجد منتجات في هذا القسم حالياً"
            body="لم يُضف أي منتج إلى هذا القسم بعد. تصفّح بقية الكتالوج في انتظار وصول الجديد."
            action={<StoreButton href={routes.shop()}>تصفّح كل المنتجات</StoreButton>}
          />
        )}
      </Container>
    </>
  );
}
