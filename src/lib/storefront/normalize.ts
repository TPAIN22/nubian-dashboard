/**
 * Backend payload -> storefront view model.
 *
 * Three things make this layer necessary rather than incidental:
 *
 * 1. **ObjectId shape is not stable across responses.** `/api/home` serves
 *    anonymous traffic from an in-process cache and clones the hit with
 *    `structuredClone`. `structuredClone` does not run `toJSON`, so a cached
 *    response serializes every `_id` as `{ buffer: { 0: 105, 1: ... } }`
 *    instead of a 24-character hex string, while a cache *miss* on the same
 *    endpoint returns the hex. A homepage that builds links from `_id` works
 *    for three minutes and then emits `/shop/[object Object]`. `toId` accepts
 *    both shapes. (The root fix belongs in the backend cache; this guard stays
 *    regardless, because it also covers `{ $oid }` from any future export.)
 *
 * 2. **Prices must never be recomputed here.** The backend pricing engine owns
 *    markup, variant discounts, offers and FX. We read the converted amount it
 *    already produced and format it; we do not multiply anything.
 *
 * 3. **Absent is not zero.** A missing rating, an empty image array and an
 *    inactive discount all have to survive as "nothing to show" so the
 *    components can omit them instead of rendering a fabricated default.
 */

import type {
  StorefrontBanner,
  StorefrontCategory,
  StorefrontCollection,
  StorefrontMoney,
  StorefrontPrice,
  StorefrontProduct,
  StorefrontStore,
  StorefrontVariant,
} from "./types";

type Unknown = Record<string, unknown>;

const isObject = (v: unknown): v is Unknown =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const HEX_24 = /^[a-f\d]{24}$/i;

/**
 * Coerce any of the shapes a Mongo ObjectId reaches us in into hex.
 *
 * Handles: hex string | `{ $oid }` | `{ _id }` | `{ buffer: {0..11} }` |
 * `{ buffer: Uint8Array }` | anything with a usable `toString`.
 * Returns "" when there is no id to be had, which callers treat as "skip".
 */
export function toId(value: unknown): string {
  if (typeof value === "string") return HEX_24.test(value) ? value.toLowerCase() : value;
  if (!isObject(value)) return "";

  if (typeof value.$oid === "string") return value.$oid.toLowerCase();

  const buf = value.buffer ?? value.data ?? (ArrayBuffer.isView(value) ? value : null);
  if (buf) {
    const bytes = ArrayBuffer.isView(buf)
      ? Array.from(buf as unknown as Uint8Array)
      : isObject(buf)
        ? Object.keys(buf)
            .map(Number)
            .filter((k) => Number.isInteger(k))
            .sort((a, b) => a - b)
            .map((k) => Number((buf as Unknown)[String(k)]))
        : [];
    if (bytes.length === 12 && bytes.every((b) => Number.isInteger(b) && b >= 0 && b <= 255)) {
      return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  }

  if (value._id !== undefined && value._id !== value) return toId(value._id);
  if (value.id !== undefined && value.id !== value) return toId(value.id);

  const s = String(value);
  return HEX_24.test(s) ? s.toLowerCase() : "";
}

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

/** Keep only usable absolute image URLs, deduplicated, order preserved. */
export function cleanImages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const raw of value) {
    const url = str(raw);
    if (!url || !/^https?:\/\//i.test(url)) continue;
    if (!out.includes(url)) out.push(url);
  }
  return out;
}

function toMoney(value: unknown): StorefrontMoney | null {
  if (!isObject(value)) return null;
  const amount = num(value.amount);
  if (amount === null) return null;
  return {
    amount,
    currency: str(value.currency) || "USD",
    formatted: str(value.formatted) || undefined,
    rateUnavailable: value.rateUnavailable === true,
  };
}

/**
 * Build the renderable price.
 *
 * Preferred source is `price` — the currency-converted block the backend adds
 * when the request carried an `x-currency` header. Products that predate the
 * conversion path (or arrive from an endpoint that skips it) only have the
 * flat `displayFinalPrice` / `finalPrice` fields, which are in the platform's
 * USD base; those are read as USD rather than mislabelled with the requested
 * currency.
 *
 * A discount is only surfaced when the backend says it is live AND the
 * original really is higher — a stale `originalPrice` equal to the final one
 * must not render as "was X, now X".
 */
export function toPrice(raw: Unknown): StorefrontPrice | null {
  const block = isObject(raw.price) ? raw.price : null;

  const final = block ? toMoney(block.final) : null;
  const original = block ? toMoney(block.original) : null;
  const pct = block ? num(block.discountPercentage) : null;

  if (final) {
    const discounted =
      block?.hasDiscount === true && !!original && original.amount > final.amount;
    return {
      final,
      original: discounted ? original : undefined,
      discountPercentage: discounted && pct && pct > 0 ? Math.round(pct) : undefined,
      hasDiscount: discounted,
    };
  }

  // Un-enriched payload: flat base-currency numbers.
  const flatFinal = num(raw.displayFinalPrice) ?? num(raw.finalPrice);
  if (flatFinal === null) return null;
  const flatOriginal = num(raw.displayOriginalPrice) ?? num(raw.originalPrice);
  const flatPct = num(raw.displayDiscountPercentage) ?? num(raw.discountPercentage);
  const discounted =
    raw.hasDiscount === true && flatOriginal !== null && flatOriginal > flatFinal;

  return {
    final: { amount: flatFinal, currency: "USD" },
    original: discounted ? { amount: flatOriginal, currency: "USD" } : undefined,
    discountPercentage: discounted && flatPct && flatPct > 0 ? Math.round(flatPct) : undefined,
    hasDiscount: discounted,
  };
}

function toVariant(raw: unknown): StorefrontVariant | null {
  if (!isObject(raw)) return null;
  const id = toId(raw._id);
  if (!id) return null;

  const attrs: Record<string, string> = {};
  if (isObject(raw.attributes)) {
    for (const [k, v] of Object.entries(raw.attributes)) {
      const value = str(v);
      // "default" / "os" are the placeholders the import writes for products
      // that have no real options. Showing them as a choice is noise.
      if (value && value !== "default" && value !== "os") attrs[k] = value;
    }
  }

  return {
    id,
    sku: str(raw.sku) || undefined,
    attributes: attrs,
    stock: num(raw.stock),
    price: toPrice(raw),
    images: cleanImages(raw.images),
  };
}

export function normalizeProduct(raw: unknown): StorefrontProduct | null {
  if (!isObject(raw)) return null;

  const id = toId(raw._id ?? raw.id);
  const name = str(raw.name);
  if (!id || !name) return null;

  const variants = Array.isArray(raw.variants)
    ? raw.variants.map(toVariant).filter((v): v is StorefrontVariant => v !== null)
    : [];

  // A product's gallery is its own images first, then anything only a variant
  // carries — plenty of imported products put every photo on the variants.
  const images = cleanImages([
    ...cleanImages(raw.images),
    ...variants.flatMap((v) => v.images),
  ]);

  const categoryRaw = raw.category;
  const category =
    isObject(categoryRaw) && str(categoryRaw.name)
      ? { id: toId(categoryRaw._id ?? categoryRaw), name: str(categoryRaw.name) }
      : null;

  // Listing endpoints populate `merchant` in place; `/home` keeps `merchant`
  // as a bare id (the mobile app reads it as merchantId) and attaches the
  // seller alongside as `store: { _id, name, logo }`.
  const storeRaw = isObject(raw.merchant) ? raw.merchant : raw.store;
  const store =
    isObject(storeRaw) && str(storeRaw.storeName ?? storeRaw.name)
      ? {
          id: toId(storeRaw._id ?? storeRaw),
          name: str(storeRaw.storeName) || str(storeRaw.name),
          logo: str(storeRaw.logoUrl) || str(storeRaw.logo) || null,
        }
      : null;

  const stock =
    num(raw.totalStock) ??
    num(raw.stock) ??
    (variants.length
      ? variants.reduce((sum, v) => sum + (v.stock ?? 0), 0)
      : null);

  return {
    id,
    name,
    description: str(raw.description) || undefined,
    images,
    price: toPrice(raw),
    category,
    store,
    stock,
    variants,
  };
}

export function normalizeCategory(raw: unknown): StorefrontCategory | null {
  if (!isObject(raw)) return null;
  const id = toId(raw._id ?? raw.id);
  const name = str(raw.name);
  if (!id || !name) return null;

  return {
    id,
    name,
    description: str(raw.description) || undefined,
    image: str(raw.image) || null,
    parentId: raw.parent ? toId(raw.parent) || null : null,
  };
}

export function normalizeCollection(raw: unknown): StorefrontCollection | null {
  if (!isObject(raw)) return null;
  const id = toId(raw._id ?? raw.id);
  const name = str(raw.name);
  const slug = str(raw.slug);
  if (!id || !name || !slug) return null;

  return {
    id,
    name,
    slug,
    description: str(raw.description) || undefined,
    image: str(raw.image) || null,
    productCount: num(raw.productCount) ?? 0,
  };
}

export function normalizeStore(raw: unknown): StorefrontStore | null {
  if (!isObject(raw)) return null;
  const id = toId(raw._id ?? raw.id);
  const name = str(raw.storeName) || str(raw.name);
  if (!id || !name) return null;

  return {
    id,
    name,
    description: str(raw.description) || undefined,
    logo: str(raw.logoUrl) || str(raw.logo) || null,
    banner: str(raw.banner) || null,
    city: str(raw.city) || null,
  };
}

export function normalizeBanner(raw: unknown): StorefrontBanner | null {
  if (!isObject(raw)) return null;
  const id = toId(raw._id ?? raw.id);
  const image = str(raw.image);
  if (!id || !image) return null;
  return {
    id,
    image,
    title: str(raw.title) || undefined,
    description: str(raw.description) || undefined,
  };
}

/** Map + drop nulls in one step, for the many `array.map(normalizeX)` calls. */
export function compactMap<T>(input: unknown, fn: (raw: unknown) => T | null): T[] {
  if (!Array.isArray(input)) return [];
  const out: T[] = [];
  for (const item of input) {
    const mapped = fn(item);
    if (mapped) out.push(mapped);
  }
  return out;
}
