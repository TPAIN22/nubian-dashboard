/**
 * Merchant storefront.
 *
 * The seller's own page: their banner, their name, their city, their
 * products. No rating and no verification badge — `getStoreById` reports
 * `rating: 4.5, verified: true` for every approved merchant as a schema
 * default, and the live stores have `totalReviews: 0` behind it. Those two
 * fields will be worth rendering the day reviews exist; until then printing
 * them is inventing a trust signal.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StoreImage } from "@/components/storefront/StoreImage";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { Pagination } from "@/components/storefront/Pagination";
import { EmptyState } from "@/components/storefront/PageIntro";
import { Breadcrumbs } from "@/components/storefront/Breadcrumbs";
import { Container } from "@/components/storefront/Section";
import { StoreButton } from "@/components/storefront/StoreButton";
import { getStore, getStoreProducts } from "@/lib/storefront/api";
import { routes } from "@/lib/storefront/routes";

const baseUrl = "https://nubian-sd.com";

export const revalidate = 300;

type Params = {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeId: string }>;
}): Promise<Metadata> {
  const { storeId } = await params;
  const store = await getStore(storeId);
  if (!store) return { title: "المتجر غير متاح" };

  const description = store.description
    ? store.description.replace(/\s+/g, " ").slice(0, 160)
    : `تصفّح منتجات متجر ${store.name} على نوبيان.`;

  return {
    title: store.name,
    description,
    alternates: { canonical: `${baseUrl}${routes.store(store.id)}` },
    openGraph: {
      title: `${store.name} | نوبيان`,
      description,
      url: `${baseUrl}${routes.store(store.id)}`,
      type: "website",
      images: store.banner ? [{ url: store.banner, alt: store.name }] : undefined,
    },
  };
}

function toPage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 500) : 1;
}

export default async function StorePage({ params, searchParams }: Params) {
  const { storeId } = await params;
  const page = toPage((await searchParams).page);

  const store = await getStore(storeId);
  if (!store) notFound();

  const { products, pagination } = await getStoreProducts(store.id, { page, limit: 24 });

  return (
    <>
      {store.banner && (
        <Container className="pt-4 md:pt-6">
          <StoreImage
            src={store.banner}
            alt=""
            className="aspect-[16/9] w-full rounded-3xl md:aspect-[4/1]"
            sizes="100vw"
            priority
            transformWidth={1800}
            quality={84}
          />
        </Container>
      )}

      <Container className="pt-6 pb-8 md:pt-8 md:pb-10">
        <Breadcrumbs
          items={[
            { label: "الرئيسية", href: routes.home() },
            { label: "كل المنتجات", href: routes.shop() },
            { label: store.name },
          ]}
        />

        <div className="mt-6 flex items-start gap-4 md:gap-5">
          {store.logo && (
            <StoreImage
              src={store.logo}
              alt=""
              className="border-sf-rule size-16 shrink-0 rounded-2xl border bg-white md:size-20"
              sizes="80px"
              transformWidth={192}
            />
          )}
          <div className="min-w-0">
            <p className="sf-eyebrow mb-1">متجر على نوبيان</p>
            <h1 className="sf-title text-[1.625rem] md:text-[2rem]">
              {store.name}
            </h1>
            {store.city && <p className="sf-meta mt-1.5">{store.city}</p>}
          </div>
        </div>

        {store.description && (
          <p className="sf-body mt-6 max-w-2xl whitespace-pre-line">{store.description}</p>
        )}
      </Container>

      <Container className="pb-20 md:pb-28">
        {products.length > 0 ? (
          <>
            <ProductGrid products={products} priorityCount={4} headingLevel={2} />
            <Pagination
              pagination={pagination}
              hrefFor={(target) => routes.store(store.id, { page: target })}
            />
          </>
        ) : (
          <EmptyState
            title="لا توجد منتجات معروضة في هذا المتجر"
            body="لم يعرض هذا التاجر أي منتج حالياً."
            action={<StoreButton href={routes.shop()}>تصفّح كل المنتجات</StoreButton>}
          />
        )}
      </Container>
    </>
  );
}
