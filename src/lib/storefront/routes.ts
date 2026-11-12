/**
 * Canonical storefront URLs.
 *
 * Every link on the public pages is built here, so a path change is one edit
 * and a typo cannot ship a dead link from six different components. Also
 * shared with `sitemap.ts`, which must agree with what the pages actually
 * serve.
 */

export const routes = {
  home: () => "/",
  shop: (params?: { q?: string; page?: number }) => {
    const search = new URLSearchParams();
    if (params?.q) search.set("q", params.q);
    if (params?.page && params.page > 1) search.set("page", String(params.page));
    const qs = search.toString();
    return qs ? `/shop?${qs}` : "/shop";
  },
  product: (id: string) => `/shop/${id}`,
  category: (id: string, params?: { page?: number }) =>
    params?.page && params.page > 1
      ? `/category/${id}?page=${params.page}`
      : `/category/${id}`,
  collection: (slug: string) => `/collection/${encodeURIComponent(slug)}`,
  store: (id: string, params?: { page?: number }) =>
    params?.page && params.page > 1 ? `/store/${id}?page=${params.page}` : `/store/${id}`,
} as const;

/** The Android app is where an order is actually placed. */
export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=dev.expo.nubian";

/**
 * Verified Nubian channels, lifted from the Organization structured data so
 * the footer and the schema cannot drift apart.
 */
export const SOCIAL_LINKS = [
  { name: "Facebook", href: "https://www.facebook.com/profile.php?id=61577343351976" },
  { name: "Instagram", href: "https://www.instagram.com/sd_nubian" },
  { name: "X", href: "https://x.com/nubian_sd" },
] as const;

export const SUPPORT_EMAIL = "info@nubian-sd.com";
export const SUPPORT_PHONE = "+966583104518";
export const SUPPORT_PHONE_DISPLAY = "+966 58 310 4518";
