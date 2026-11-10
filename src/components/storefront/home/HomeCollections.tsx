/**
 * Curated collections.
 *
 * Collections are the one piece of genuine editorial merchandising the
 * platform owns: an admin hand-picks an ordered list of products and writes a
 * title and a blurb for it. They are rendered here from whatever is live, and
 * nothing is invented around them — no "New Arrivals" card pointing at a
 * search, no fabricated count.
 *
 * Two filters decide what appears:
 *   - `productCount === 0` is dropped. A collection link has to land on
 *     products; an empty one is a dead end with a nice photograph.
 *   - no `image` is dropped, because this treatment is the photograph.
 *
 * Layout adapts to how many survive. With one — which is the live situation —
 * a grid of one card reads as a mistake, so it becomes a full-width editorial
 * split instead. With two or more it is a grid.
 */

import Link from "next/link";

import { StoreImage } from "../StoreImage";
import { Section, SectionHeading } from "../Section";
import { StoreButton } from "../StoreButton";
import { routes } from "@/lib/storefront/routes";
import type { StorefrontCollection } from "@/lib/storefront/types";

function usable(collections: StorefrontCollection[]) {
  return collections.filter((c) => c.productCount > 0 && c.image);
}

export function HomeCollections({
  collections,
}: {
  collections: StorefrontCollection[];
}) {
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
    <Section aria-labelledby="collection-heading">
      {/* Image held to a narrow 4:5 column: collection covers are uploaded
          by admins from whatever they have, and the live one is a phone
          photo that goes soft at half-page width. */}
      <div className="grid items-center gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
        <Link
          href={routes.collection(collection.slug)}
          className="sf-focus group block"
          tabIndex={-1}
          aria-hidden="true"
        >
          <StoreImage
            src={collection.image}
            alt=""
            className="aspect-[4/5] w-full max-w-md rounded-[2px]"
            sizes="(min-width: 1024px) 34vw, (min-width: 768px) 40vw, 92vw"
            transformWidth={720}
            imageClassName="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        </Link>

        <div className="max-w-xl">
          <p className="sf-eyebrow mb-2.5">مجموعة مختارة</p>
          <h2 id="collection-heading" className="sf-title text-sf-ink">
            {collection.name}
          </h2>
          {collection.description && (
            <p className="sf-body mt-5 line-clamp-4">{collection.description}</p>
          )}
          <StoreButton href={routes.collection(collection.slug)} className="mt-8">
            اكتشف المجموعة
          </StoreButton>
        </div>
      </div>
    </Section>
  );
}

function CollectionGrid({ collections }: { collections: StorefrontCollection[] }) {
  return (
    <Section aria-labelledby="collections-heading" divided>
      <SectionHeading
        id="collections-heading"
        eyebrow="مجموعات مختارة"
        title="اختيارات نوبيان"
      />
      <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection) => (
          <li key={collection.id}>
            <Link
              href={routes.collection(collection.slug)}
              className="sf-focus group block"
            >
              <StoreImage
                src={collection.image}
                alt={collection.name}
                className="aspect-[4/3] w-full"
                sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
                transformWidth={720}
                imageClassName="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              />
              <h3 className="sf-product-name group-hover:text-sf-accent mt-4 text-base transition-colors">
                {collection.name}
              </h3>
              {collection.description && (
                <p className="sf-meta mt-1.5 line-clamp-2">{collection.description}</p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
