/**
 * Server-side reads for the public storefront.
 *
 * Server-only on purpose. These run in Server Components and hit the backend
 * directly with `fetch`, so the catalogue is rendered into the HTML rather
 * than fetched again from the browser — no loading spinners, no client bundle
 * for data access, and the pages stay indexable.
 *
 * Every function is total: a backend that is down, slow or returning garbage
 * yields an empty result, never a throw. A marketplace homepage that 500s
 * because a recommendation rail timed out is worse than one that quietly
 * renders fewer sections, and each section is written to disappear when its
 * data is empty.
 *
 * Caching is ISR via `next.revalidate`. Catalogue data changes on the order of
 * minutes, not seconds, and the backend already fronts `/home` with its own
 * three-minute cache.
 */

import "server-only";

import {
  compactMap,
  normalizeBanner,
  normalizeCategory,
  normalizeCollection,
  normalizeProduct,
  normalizeStore,
} from "./normalize";
import type {
  StorefrontCategory,
  StorefrontCollection,
  StorefrontHomeFeed,
  StorefrontPagination,
  StorefrontProduct,
  StorefrontStore,
} from "./types";

/**
 * Display currency for the public storefront.
 *
 * The admin and merchant consoles deliberately send no `x-currency` header, so
 * every amount they handle is the platform's USD base (see `lib/currency.ts`).
 * The storefront is the opposite case: it serves shoppers in Sudan, so it asks
 * the backend to convert, and the backend's FX layer — not this app — does the
 * arithmetic. Changing this constant changes the whole storefront's currency.
 */
export const STOREFRONT_CURRENCY = "SDG";
export const STOREFRONT_COUNTRY = "SD";

const REVALIDATE = {
  /** Merchandising: the backend's own cache is 3 minutes, so match it. */
  home: 180,
  catalogue: 300,
  /** Taxonomy and store profiles move rarely. */
  reference: 900,
} as const;

function apiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL || process.env.AUTH_API_URL || "";
  if (!raw) return "";
  const trimmed = raw.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

type Query = Record<string, string | number | undefined | null>;

interface Envelope<T> {
  data: T | null;
  pagination: StorefrontPagination | null;
}

const EMPTY: Envelope<never> = { data: null, pagination: null };

/**
 * One GET against the backend.
 *
 * `revalidate` seconds of ISR, a hard timeout so a hung backend cannot pin a
 * render, and a catch-all that downgrades every failure to `{ data: null }`.
 *
 * The ceiling is sized for a cold start: the backend sleeps on Render's free
 * tier and the first request after an idle period can take ~20s while the
 * instance boots and reconnects to Mongo. A 12s timeout was measured aborting
 * every catalogue read during a cold build, which produced a technically
 * successful build of an empty storefront. Because reads are ISR, a slow
 * revalidation never blocks a visitor — the stale page is served while it
 * runs — so the cost of the longer ceiling is build time, not latency.
 */
const FETCH_TIMEOUT_MS = 25_000;

async function get<T>(
  path: string,
  options: { query?: Query; revalidate?: number } = {},
): Promise<Envelope<T>> {
  const base = apiBase();
  if (!base) {
    console.error("[storefront] NEXT_PUBLIC_API_URL is not set — catalogue unavailable.");
    return EMPTY;
  }

  const url = new URL(`${base}${path}`);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: {
        accept: "application/json",
        "x-currency": STOREFRONT_CURRENCY,
        "x-country": STOREFRONT_COUNTRY,
      },
      signal: controller.signal,
      next: { revalidate: options.revalidate ?? REVALIDATE.catalogue },
    });

    if (!res.ok) {
      // 404 is an ordinary answer for a detail route, not an incident.
      if (res.status !== 404) {
        console.error(`[storefront] GET ${path} -> ${res.status}`);
      }
      return EMPTY;
    }

    const body: unknown = await res.json();

    // The backend uses `{ success, data, meta }` for most routes but returns a
    // bare array from `/categories`. Accept both.
    if (Array.isArray(body)) return { data: body as T, pagination: null };
    if (typeof body !== "object" || body === null) return EMPTY;

    const envelope = body as Record<string, unknown>;
    const meta = envelope.meta as Record<string, unknown> | undefined;
    const pagination = (meta?.pagination as StorefrontPagination | undefined) ?? null;

    return {
      data: ("data" in envelope ? envelope.data : envelope) as T,
      pagination,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`[storefront] GET ${path} failed: ${reason}`);
    return EMPTY;
  } finally {
    clearTimeout(timeout);
  }
}

/* -- Home ----------------------------------------------------------------- */

const EMPTY_FEED: StorefrontHomeFeed = {
  banners: [],
  categories: [],
  collections: [],
  products: [],
  newArrivals: [],
  stores: [],
};

/**
 * The homepage feed.
 *
 * `/api/home` returns five product rails. `trending`, `forYou` and
 * `brandsYouLove` are all derived from the same ranked list today and arrive
 * byte-identical, so they are merged into one `products` list instead of
 * becoming three sections with different headings over the same items.
 * `newArrivals` is kept separate because it is genuinely a different query —
 * it is simply empty at the moment, and the section that reads it hides
 * itself when it stays that way.
 */
export async function getHomeFeed(): Promise<StorefrontHomeFeed> {
  const { data } = await get<Record<string, unknown>>("/home", {
    revalidate: REVALIDATE.home,
  });
  if (!data) return EMPTY_FEED;

  const rails = ["trending", "forYou", "brandsYouLove"] as const;
  const seen = new Set<string>();
  const products: StorefrontProduct[] = [];
  for (const rail of rails) {
    for (const product of compactMap(data[rail], normalizeProduct)) {
      if (seen.has(product.id)) continue;
      seen.add(product.id);
      products.push(product);
    }
  }

  const newArrivals = compactMap(data.newArrivals, normalizeProduct).filter(
    (p) => !seen.has(p.id),
  );

  return {
    banners: compactMap(data.banners, normalizeBanner),
    categories: compactMap(data.categories, normalizeCategory),
    collections: compactMap(data.collections, normalizeCollection),
    products,
    newArrivals,
    stores: compactMap(data.stores, normalizeStore),
  };
}

/* -- Catalogue ------------------------------------------------------------ */

export interface ProductListResult {
  products: StorefrontProduct[];
  pagination: StorefrontPagination | null;
}

export async function getProducts(params: {
  page?: number;
  limit?: number;
  category?: string;
  merchant?: string;
} = {}): Promise<ProductListResult> {
  const { data, pagination } = await get<unknown[]>("/products", {
    query: {
      page: params.page,
      limit: params.limit ?? 24,
      category: params.category,
      merchant: params.merchant,
    },
  });
  return { products: compactMap(data, normalizeProduct), pagination };
}

export async function getProduct(id: string): Promise<StorefrontProduct | null> {
  if (!/^[a-f\d]{24}$/i.test(id)) return null;
  const { data } = await get<unknown>(`/products/${id}`);
  return normalizeProduct(data);
}

/**
 * Keyword search over the public catalogue.
 *
 * The backend's text search lives on the admin-only listing, so the public
 * route offers no `?search=`. Rather than add a backend endpoint for a visual
 * redesign, this pulls the catalogue in pages and matches in process.
 *
 * That is honest about its limits: `SEARCH_SCAN_CAP` bounds the work at 300
 * products, and `truncated` is returned so the page can say so. Past that
 * size the right fix is a `search` parameter on `GET /products` — this
 * function is then deleted, not grown.
 */
const SEARCH_SCAN_CAP = 300;
const SEARCH_PAGE_SIZE = 100;

export interface SearchResult {
  products: StorefrontProduct[];
  /** True when the catalogue is larger than the scan cap. */
  truncated: boolean;
}

export async function searchProducts(term: string): Promise<SearchResult> {
  const needle = term.trim().toLocaleLowerCase();
  if (!needle) return { products: [], truncated: false };

  const scanned: StorefrontProduct[] = [];
  let truncated = false;

  for (let page = 1; scanned.length < SEARCH_SCAN_CAP; page += 1) {
    const { products, pagination } = await getProducts({
      page,
      limit: SEARCH_PAGE_SIZE,
    });
    scanned.push(...products);
    if (!pagination?.hasNextPage || products.length === 0) break;
    if (scanned.length >= SEARCH_SCAN_CAP) {
      truncated = true;
      break;
    }
  }

  const matches = scanned.filter((product) => {
    const haystack = [
      product.name,
      product.category?.name ?? "",
      product.store?.name ?? "",
      product.description ?? "",
    ]
      .join(" ")
      .toLocaleLowerCase();
    return haystack.includes(needle);
  });

  return { products: matches, truncated };
}

/* -- Taxonomy ------------------------------------------------------------- */

export async function getCategories(): Promise<StorefrontCategory[]> {
  const { data } = await get<unknown[]>("/categories", {
    revalidate: REVALIDATE.reference,
  });
  return compactMap(data, normalizeCategory);
}

export async function getCategory(id: string): Promise<StorefrontCategory | null> {
  if (!/^[a-f\d]{24}$/i.test(id)) return null;
  const { data } = await get<unknown>(`/categories/${id}`, {
    revalidate: REVALIDATE.reference,
  });
  // This route answers with the bare document rather than an envelope.
  return normalizeCategory(data);
}

/* -- Collections ---------------------------------------------------------- */

export interface CollectionDetail {
  collection: StorefrontCollection;
  products: StorefrontProduct[];
}

export async function getCollection(slugOrId: string): Promise<CollectionDetail | null> {
  const { data } = await get<Record<string, unknown>>(
    `/collections/${encodeURIComponent(slugOrId)}`,
  );
  const collection = normalizeCollection(data);
  if (!collection) return null;
  return {
    collection,
    products: compactMap(data?.products, normalizeProduct),
  };
}

/* -- Stores --------------------------------------------------------------- */

export async function getStore(id: string): Promise<StorefrontStore | null> {
  if (!/^[a-f\d]{24}$/i.test(id)) return null;
  const { data } = await get<unknown>(`/merchants/store/${id}`, {
    revalidate: REVALIDATE.reference,
  });
  return normalizeStore(data);
}

export async function getStoreProducts(
  id: string,
  params: { page?: number; limit?: number } = {},
): Promise<ProductListResult> {
  if (!/^[a-f\d]{24}$/i.test(id)) return { products: [], pagination: null };
  const { data, pagination } = await get<unknown[]>(`/merchants/store/${id}/products`, {
    query: { page: params.page, limit: params.limit ?? 24 },
  });
  return { products: compactMap(data, normalizeProduct), pagination };
}
