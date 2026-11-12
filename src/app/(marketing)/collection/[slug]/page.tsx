/**
 * Collection detail.
 *
 * A collection is an admin-curated, *ordered* list, so this page does not
 * paginate or re-sort: the backend returns the products in the sequence they
 * were arranged in, and that order is the editorial decision being presented.
 *
 * The route accepts the slug (Arabic slugs included — the backend's slugifier
 * keeps Unicode letters, so "مجموعة-توبياكو…" is a legitimate path segment)
 * and the ObjectId, matching what the backend's `/collections/:id` resolves.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StoreImage } from "@/components/storefront/StoreImage";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { PageIntro, EmptyState } from "@/components/storefront/PageIntro";
import { Container } from "@/components/storefront/Section";
import { StoreButton } from "@/components/storefront/StoreButton";
import { getCollection } from "@/lib/storefront/api";
import { routes } from "@/lib/storefront/routes";

const baseUrl = "https://nubian-sd.com";

export const revalidate = 300;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getCollection(decodeURIComponent(slug));
  if (!detail) return { title: "المجموعة غير متاحة" };

  const { collection } = detail;
  const description = collection.description
    ? collection.description.replace(/\s+/g, " ").slice(0, 160)
    : `مجموعة ${collection.name} على نوبيان.`;

  return {
    title: collection.name,
    description,
    alternates: { canonical: `${baseUrl}${routes.collection(collection.slug)}` },
    openGraph: {
      title: `${collection.name} | نوبيان`,
      description,
      url: `${baseUrl}${routes.collection(collection.slug)}`,
      type: "website",
      images: collection.image
        ? [{ url: collection.image, alt: collection.name }]
        : undefined,
    },
  };
}

export default async function CollectionPage({ params }: Params) {
  const { slug } = await params;
  const detail = await getCollection(decodeURIComponent(slug));
  if (!detail) notFound();

  const { collection, products } = detail;

  return (
    <>
      {/* The cover runs full-bleed above the masthead: a collection is the one
          place on the storefront where the art direction leads. */}
      {collection.image && (
        <StoreImage
          src={collection.image}
          alt=""
          className="aspect-[16/9] w-full md:aspect-[3/1]"
          sizes="100vw"
          priority
          transformWidth={1800}
          quality={84}
        />
      )}

      <PageIntro
        crumbs={[
          { label: "الرئيسية", href: routes.home() },
          { label: "كل المنتجات", href: routes.shop() },
          { label: collection.name },
        ]}
        title={collection.name}
        description={collection.description}
      />

      <Container className="pb-20 md:pb-28">
        {products.length > 0 ? (
          <ProductGrid products={products} priorityCount={4} headingLevel={2} />
        ) : (
          <EmptyState
            title="هذه المجموعة فارغة حالياً"
            body="لم تُضَف منتجات إلى هذه المجموعة بعد."
            action={<StoreButton href={routes.shop()}>تصفّح كل المنتجات</StoreButton>}
          />
        )}
      </Container>
    </>
  );
}
