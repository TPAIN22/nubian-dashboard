/**
 * Curated collections.
 *
 * Admin-picked, ordered product lists with a title and a blurb. Only
 * collections that have products and a cover image are shown.
 *
 * One live collection becomes a wide banner card (a grid of one reads as a
 * mistake); two or more become a grid of cards.
 */

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { StoreImage } from "../StoreImage";
import { Section, SectionHeading } from "../Section";
import { StoreButton } from "../StoreButton";
import { routes } from "@/lib/storefront/routes";
import type { StorefrontCollection } from "@/lib/storefront/types";

function usable(collections: StorefrontCollection[]) {
  return collections.filter((c) => c.productCount > 0 && c.image);
}

export function HomeCollections({ collections }: { collections: StorefrontCollection[] }) {
  const live = usable(collections);
  if (live.length === 0) return null;

  return live.length === 1 ? (
    <SingleCollection collection={live[0]} />
  ) : (
    <CollectionGrid collections={live.slice(0, 3)} />
  );
}

function SingleCollection({ collection }: { collection: StorefrontCollection }) {
  return (
    <Section aria-labelledby="collection-heading" space="tight">
      <div className="sf-card grid overflow-hidden md:grid-cols-2">
        <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
          <p className="sf-eyebrow">مجموعة مختارة</p>
          <h2 id="collection-heading" className="sf-title mt-2">
            {collection.name}
          </h2>
          {collection.description && (
            <p className="sf-body mt-4 line-clamp-4 max-w-[46ch]">{collection.description}</p>
          )}
          <StoreButton href={routes.collection(collection.slug)} className="mt-8 w-fit">
            اكتشف المجموعة
            <ArrowLeft aria-hidden="true" className="h-4 w-4 ltr:rotate-180" />
          </StoreButton>
        </div>

        <Link
          href={routes.collection(collection.slug)}
          className="group block p-3 md:order-first"
          tabIndex={-1}
          aria-hidden="true"
        >
          <StoreImage
            src={collection.image}
            alt=""
            className="aspect-[4/3] h-full w-full rounded-xl md:aspect-auto md:min-h-[380px]"
            sizes="(min-width: 768px) 45vw, 92vw"
            transformWidth={960}
            imageClassName="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        </Link>
      </div>
    </Section>
  );
}

function CollectionGrid({ collections }: { collections: StorefrontCollection[] }) {
  return (
    <Section aria-labelledby="collections-heading">
      <SectionHeading id="collections-heading" eyebrow="مجموعات مختارة" title="اختيارات نوبيان" />
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection) => (
          <li key={collection.id}>
            <Link
              href={routes.collection(collection.slug)}
              className="sf-focus sf-card sf-card-hover group block overflow-hidden p-2.5"
            >
              <StoreImage
                src={collection.image}
                alt={collection.name}
                className="aspect-[4/3] w-full rounded-xl"
                sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
                transformWidth={720}
                imageClassName="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              />
              <div className="px-2 pt-4 pb-2">
                <h3 className="sf-heading group-hover:text-sf-accent transition-colors">
                  {collection.name}
                </h3>
                {collection.description && (
                  <p className="sf-meta mt-1 line-clamp-2">{collection.description}</p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
