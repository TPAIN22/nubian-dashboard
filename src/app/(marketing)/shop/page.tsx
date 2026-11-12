/**
 * /shop — the catalogue.
 *
 * Two modes behind one route:
 *   - no `?q`: the ranked catalogue, paginated through `GET /products`
 *   - with `?q`: keyword results via `searchProducts`
 *
 * Search has no backend endpoint on the public API (the `?search=` parameter
 * exists only on the admin listing), so `searchProducts` scans a bounded slice
 * of the catalogue in process. When it hits that bound the page says so
 * rather than silently presenting partial results as complete. See the note
 * on `SEARCH_SCAN_CAP` in `lib/storefront/api.ts`.
 */

import type { Metadata } from "next";

import { ProductGrid } from "@/components/storefront/ProductGrid";
import { Pagination } from "@/components/storefront/Pagination";
import { PageIntro, EmptyState } from "@/components/storefront/PageIntro";
import { SearchForm } from "@/components/storefront/SearchForm";
import { Container } from "@/components/storefront/Section";
import { StoreButton } from "@/components/storefront/StoreButton";
import { getProducts, searchProducts } from "@/lib/storefront/api";
import { routes } from "@/lib/storefront/routes";

const baseUrl = "https://nubian-sd.com";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "كل المنتجات",
  description:
    "تصفّح منتجات نوبيان من تجار سودانيين معتمدين — أزياء وعطور وإلكترونيات ومستلزمات يومية.",
  alternates: { canonical: `${baseUrl}/shop` },
  openGraph: {
    title: "كل المنتجات | نوبيان",
    description: "تصفّح منتجات نوبيان من تجار سودانيين معتمدين.",
    url: `${baseUrl}/shop`,
    type: "website",
  },
};

const PAGE_SIZE = 24;

function toPage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 500) : 1;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}) {
  const params = await searchParams;
  const query = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim() ?? "";
  const page = toPage(params.page);

  if (query) {
    const { products, truncated } = await searchProducts(query);

    return (
      <>
        <PageIntro
          crumbs={[
            { label: "الرئيسية", href: routes.home() },
            { label: "كل المنتجات", href: routes.shop() },
            { label: `نتائج البحث: ${query}` },
          ]}
          title={`نتائج البحث عن «${query}»`}
          description={
            products.length > 0 ? `${products.length} منتج مطابق.` : undefined
          }
          aside={<SearchForm id="shop-search" defaultValue={query} className="md:w-72" />}
        />

        <Container className="pb-20 md:pb-28">
          {products.length > 0 ? (
            <>
              <ProductGrid products={products} priorityCount={4} headingLevel={2} />
              {truncated && (
                <p className="sf-meta border-sf-rule mt-12 border-t pt-6">
                  يشمل البحث أحدث ٣٠٠ منتج في الكتالوج. جرّب تضييق الكلمة المفتاحية
                  أو التصفّح حسب القسم للحصول على نتائج أدق.
                </p>
              )}
            </>
          ) : (
            <EmptyState
              title="لا توجد نتائج مطابقة"
              body="لم نعثر على منتج يطابق بحثك. جرّب كلمة أخرى أو تصفّح الكتالوج كاملاً."
              action={<StoreButton href={routes.shop()}>تصفّح كل المنتجات</StoreButton>}
            />
          )}
        </Container>
      </>
    );
  }

  const { products, pagination } = await getProducts({ page, limit: PAGE_SIZE });

  return (
    <>
      <PageIntro
        crumbs={[{ label: "الرئيسية", href: routes.home() }, { label: "كل المنتجات" }]}
        title="كل المنتجات"
        description="كل ما هو معروض الآن على نوبيان، من كل التجار المعتمدين."
        // No search field here. The header already carries one at every
        // breakpoint, and a second empty box directly beneath it is clutter.
        // The results view below does repeat it, because there the field is
        // pre-filled with the query and exists to refine it.
      />

      <Container className="pb-20 md:pb-28">
        {products.length > 0 ? (
          <>
            <ProductGrid products={products} priorityCount={4} headingLevel={2} />
            <Pagination
              pagination={pagination}
              hrefFor={(target) => routes.shop({ page: target })}
            />
          </>
        ) : (
          <EmptyState
            title="الكتالوج غير متاح حالياً"
            body="تعذّر تحميل المنتجات في الوقت الحالي. يرجى المحاولة بعد قليل."
            action={<StoreButton href={routes.home()}>العودة للرئيسية</StoreButton>}
          />
        )}
      </Container>
    </>
  );
}
