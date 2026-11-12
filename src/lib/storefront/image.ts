/**
 * Image delivery for the storefront.
 *
 * Every catalogue image in this platform is hosted on ImageKit, which resizes
 * and re-encodes from URL parameters. Asking it for the size we are actually
 * going to paint means `next/image`'s optimizer fetches a ~100KB source
 * instead of a multi-megabyte phone photo, which is where most of the
 * homepage's byte budget was going.
 *
 * Non-ImageKit URLs pass through untouched — the transform is an enhancement,
 * never a requirement, and a merchant logo served from somewhere else must
 * still render.
 */

const IMAGEKIT_HOST = "ik.imagekit.io";

export interface ImageTransform {
  /** Target width in CSS pixels at 1x. */
  width?: number;
  height?: number;
  /** Quality 1-100. ImageKit's default is 80; raise it only for hero art. */
  quality?: number;
}

export function isImageKit(url: string): boolean {
  try {
    return new URL(url).hostname === IMAGEKIT_HOST;
  } catch {
    return false;
  }
}

/**
 * Append an ImageKit transformation chain to a catalogue URL.
 *
 * `c-maintain_ratio` with only a width lets ImageKit pick the height, so an
 * image is never distorted to fit; `f-auto` negotiates AVIF/WebP per client.
 * An existing `tr=` on the URL is left alone — if a merchant or an admin tool
 * already chose a transform, that choice wins.
 */
export function ik(url: string | null | undefined, transform: ImageTransform = {}): string {
  const src = (url ?? "").trim();
  if (!src || !isImageKit(src)) return src;

  try {
    const parsed = new URL(src);
    if (parsed.searchParams.has("tr")) return src;

    const parts = ["f-auto"];
    if (transform.width) parts.push(`w-${Math.round(transform.width)}`);
    if (transform.height) parts.push(`h-${Math.round(transform.height)}`);
    if (transform.width || transform.height) parts.push("c-maintain_ratio");
    parts.push(`q-${transform.quality ?? 80}`);

    parsed.searchParams.set("tr", parts.join(","));
    return parsed.toString();
  } catch {
    return src;
  }
}

/**
 * The image a product card should lead with.
 *
 * Returns `null` rather than a stand-in so the card can render its own
 * fallback. Substituting another product's photo here would be a lie about
 * what is for sale.
 */
export function primaryImage(images: string[]): string | null {
  return images.length > 0 ? images[0] : null;
}

/**
 * Pre-encoded homepage stills in `public/story`.
 *
 * Each photo ships as `<name>.webp` (1800px) and `<name>-828.webp`, generated
 * once from the Unsplash originals (see `public/story/ASSETS.md`). This loader
 * picks between them so the browser still gets a responsive `srcset`, but no
 * request ever reaches `/_next/image`: decoding and re-encoding these on the
 * server, on a cold cache, was enough to push the instance past its memory
 * limit.
 */
const STORY_PREFIX = "/story/";
const STORY_SMALL_WIDTH = 828;

export function isStoryImage(src: string): boolean {
  return src.startsWith(STORY_PREFIX) && src.endsWith(".webp");
}

export function storyLoader({ src, width }: { src: string; width: number }): string {
  return width <= STORY_SMALL_WIDTH
    ? src.replace(/\.webp$/, `-${STORY_SMALL_WIDTH}.webp`)
    : src;
}
