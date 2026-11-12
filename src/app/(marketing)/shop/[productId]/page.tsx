/**
 * Product detail.
 *
 * Read-only by design. This app has no cart, no checkout and no payment
 * surface — ordering happens in the Android app — so the page's job is to
 * present the product honestly and hand off, not to imitate a buy flow it
 * cannot complete. A disabled "Add to cart" button would be worse than no
 * button.
 *
 * Everything rendered comes from `GET /products/:id`:
 *   - prices from the backend pricing engine, already converted to SDG
 *   - availability from real stock, including per-variant stock
 *   - the merchant, linked to their storefront
 * Ratings are *not* rendered: `averageRating` is 0 on the live catalogue with
 * no reviews behind it, and a zero-star product is a worse lie than silence.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StoreImage } from "@/components/storefront/StoreImage";
import { Price } from "@/components/storefront/Price";
import { Container, Section, SectionHeading } from "@/components/storefront/Section";
import { Breadcrumbs } from "@/components/storefront/Breadcrumbs";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { StoreButtonExternal } from "@/components/storefront/StoreButton";
import { getProduct, getProducts } from "@/lib/storefront/api";
import { routes, PLAY_STORE_URL } from "@/lib/storefront/routes";
import { ik } from "@/lib/storefront/image";
import type { StorefrontProduct } from "@/lib/storefront/types";

const baseUrl = "https://nubian-sd.com";

export const revalidate = 300;

type Params = { params: Promise<{ productId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { productId } = await params;
  const product = await getProduct(productId);
  if (!product) return { title: "المنتج غير متاح" };

  // Descriptions in this catalogue are long-form merchant copy; trim to a
  // length a SERP will actually show rather than letting Google cut it.
  const description = product.description
    ? product.description.replace(/\s+/g, " ").slice(0, 160)
    : `${product.name} على نوبيان.`;

  return {
    title: product.name,
    description,
    alternates: { canonical: `${baseUrl}${routes.product(product.id)}` },
    openGraph: {
      title: product.name,
      description,
      url: `${baseUrl}${routes.product(product.id)}`,
      type: "website",
      images: product.images[0]
        ? [{ url: ik(product.images[0], { width: 1200 }), alt: product.name }]
        : undefined,
    },
  };
}

/** Product + Offer markup. Emitted only when there is a real price to quote. */
function ProductSchema({ product }: { product: StorefrontProduct }) {
  if (!product.price) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description?.slice(0, 500),
    image: product.images.slice(0, 5),
    url: `${baseUrl}${routes.product(product.id)}`,
    ...(product.category ? { category: product.category.name } : {}),
    ...(product.store ? { brand: { "@type": "Brand", name: product.store.name } } : {}),
    offers: {
      "@type": "Offer",
      price: product.price.final.amount,
      priceCurrency: product.price.final.currency,
      url: `${baseUrl}${routes.product(product.id)}`,
      availability:
        product.stock === null || product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      ...(product.store ? { seller: { "@type": "Organization", name: product.store.name } } : {}),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/** Variant option values, grouped by attribute. Informational, not a picker. */
function variantOptions(product: StorefrontProduct): Array<[string, string[]]> {
  const groups = new Map<string, Set<string>>();
  for (const variant of product.variants) {
    for (const [key, value] of Object.entries(variant.attributes)) {
      if (!groups.has(key)) groups.set(key, new Set());
      groups.get(key)!.add(value);
    }
  }
  return [...groups.entries()]
    .map(([key, values]) => [key, [...values]] as [string, string[]])
    .filter(([, values]) => values.length > 0);
}

const ATTRIBUTE_LABELS: Record<string, string> = {
  size: "المقاسات",
  color: "الألوان",
  material: "الخامات",
};

export default async function ProductPage({ params }: Params) {
  const { productId } = await params;
  const product = await getProduct(productId);
  if (!product) notFound();

  const inStock = product.stock === null || product.stock > 0;
  const options = variantOptions(product);

  // "More from this category" rather than a generic rail — a related row has
  // to be related. Skipped entirely when the category is unknown.
  const related = product.category
    ? (await getProducts({ category: product.category.id, limit: 10 })).products
        .filter((candidate) => candidate.id !== product.id)
        .slice(0, 4)
    : [];

  return (
    <>
      <ProductSchema product={product} />

      <Container className="pt-8 md:pt-12">
        <Breadcrumbs
          items={[
            { label: "الرئيسية", href: routes.home() },
            { label: "كل المنتجات", href: routes.shop() },
            ...(product.category
              ? [{ label: product.category.name, href: routes.category(product.category.id) }]
              : []),
            { label: product.name },
          ]}
        />
      </Container>

      <Container className="pt-8 pb-16 md:pt-12 md:pb-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16">
          {/* Gallery: a static stack, not a carousel. Every photograph is
              visible at once and nothing needs JavaScript to reach. */}
          <div className="space-y-3 md:space-y-4">
            <StoreImage
              src={product.images[0]}
              alt={product.name}
              className="aspect-[4/5] w-full"
              sizes="(min-width: 1024px) 52vw, 100vw"
              priority
              transformWidth={1100}
              quality={85}
            />
            {product.images.length > 1 && (
              <ul className="grid grid-cols-3 gap-3 md:gap-4">
                {product.images.slice(1, 7).map((image, index) => (
                  <li key={image}>
                    <StoreImage
                      src={image}
                      alt={`${product.name} — صورة ${index + 2}`}
                      className="aspect-square w-full"
                      sizes="(min-width: 1024px) 17vw, 31vw"
                      transformWidth={420}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Detail column. Sticky on desktop so a long gallery does not leave
              the price scrolled off the screen. */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            {product.category && (
              <Link
                href={routes.category(product.category.id)}
                className="sf-focus sf-eyebrow hover:text-sf-ink inline-block py-1 transition-colors"
              >
                {product.category.name}
              </Link>
            )}

            <h1 className="sf-title text-sf-ink mt-3 text-[1.75rem] md:text-[2.25rem]">
              {product.name}
            </h1>

            <Price price={product.price} size="lg" className="mt-6" />

            <p className="sf-meta mt-3">
              {inStock ? (
                product.stock !== null && product.stock <= 5 ? (
                  <span className="text-sf-accent font-medium">
                    بقي <bdi>{product.stock}</bdi> في المخزون
                  </span>
                ) : (
                  "متوفر"
                )
              ) : (
                <span className="font-medium">نفدت الكمية</span>
              )}
            </p>

            {product.store && (
              <div className="border-sf-rule mt-7 flex items-center gap-3 border-y py-5">
                {product.store.logo && (
                  <StoreImage
                    src={product.store.logo}
                    alt=""
                    className="border-sf-rule size-11 shrink-0 rounded-full border"
                    sizes="44px"
                    transformWidth={96}
                  />
                )}
                <div className="min-w-0">
                  <p className="sf-meta">يُباع بواسطة</p>
                  <Link
                    href={routes.store(product.store.id)}
                    className="sf-focus sf-product-name hover:text-sf-accent block truncate py-0.5 transition-colors"
                  >
                    {product.store.name}
                  </Link>
                </div>
              </div>
            )}

            {options.length > 0 && (
              <dl className="mt-7 space-y-4">
                {options.map(([key, values]) => (
                  <div key={key} className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
                    <dt className="sf-meta text-sf-ink font-medium">
                      {ATTRIBUTE_LABELS[key] ?? key}
                    </dt>
                    <dd className="flex flex-wrap gap-2">
                      {values.map((value) => (
                        <span
                          key={value}
                          className="border-sf-rule text-sf-ink inline-flex h-8 items-center rounded-[3px] border px-3 text-[0.8125rem]"
                        >
                          <bdi>{value}</bdi>
                        </span>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="mt-9">
              <StoreButtonExternal href={PLAY_STORE_URL} size="lg" className="w-full sm:w-auto">
                اطلب عبر التطبيق
              </StoreButtonExternal>
              <p className="sf-meta mt-3">
                يتم إتمام الطلب والدفع من خلال تطبيق نوبيان على أندرويد.
              </p>
            </div>

            {product.description && (
              <div className="border-sf-rule mt-10 border-t pt-8">
                <h2 className="sf-product-name text-base">تفاصيل المنتج</h2>
                {/* `whitespace-pre-line` preserves the paragraph breaks
                    merchants type; the text is plain, never HTML. */}
                <p className="sf-body mt-3 whitespace-pre-line">{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </Container>

      {related.length > 0 && product.category && (
        <Section aria-labelledby="related-heading" divided>
          <SectionHeading
            id="related-heading"
            title={`المزيد من ${product.category.name}`}
            action={{
              label: "عرض القسم",
              href: routes.category(product.category.id),
            }}
          />
          <ProductGrid products={related} />
        </Section>
      )}
    </>
  );
}
