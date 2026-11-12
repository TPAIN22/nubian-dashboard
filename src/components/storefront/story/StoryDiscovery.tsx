/**
 * The departments chapter — pinned, three frames, one light.
 *
 * Each frame is a campaign still shot in the same hard afternoon sun as the
 * opening (see `public/story/ASSETS.md`), paired with a department that
 * actually exists in the live taxonomy. The picture is art direction; the
 * title and the link are data.
 *
 * Why not the departments' own category art, as before: that art is uploaded
 * per category by whoever created it, and it shows. In the live taxonomy one
 * department's "photograph" is a merchant's logo with a transparency
 * checkerboard baked into the pixels, another is a white-background flat lay,
 * a third is a generated studio render. Cross-dissolving between them made
 * the brand's central sequence look like three different shops. The category
 * art still drives the catalogue pages; it is just not asked to carry the
 * brand film.
 *
 * Frames are matched to departments by name, so a frame only plays when its
 * department is live — delete "عطور" and the perfume frame goes with it. If
 * nothing matches (an unreachable backend), the chapter is skipped rather than
 * playing pictures that link nowhere; the opening frame already carries the
 * way into the shop.
 */

import Link from "next/link";

import { Chapter, type ChapterBeat } from "./Chapter";
import { routes } from "@/lib/storefront/routes";
import type { StorefrontCategory } from "@/lib/storefront/types";

interface Frame {
  /** Matched against live department names. First match wins. */
  match: RegExp;
  image: string;
  alt: string;
  imagePosition: string;
  /** Shown instead of the department's own name when set. */
  title?: string;
  body: string;
  /** Link every matching department, not just the first (e.g. men's + women's). */
  linkAll?: boolean;
}

const FRAMES: Frame[] = [
  {
    match: /عطور|عطر/,
    image: "/story/bottle-shadow.webp",
    alt: "ظل زجاجة عطر على حجر جيري تحت شمس العصر",
    imagePosition: "50% 55%",
    body: "عود، ومسك، وزهر. ولكل يومٍ رائحته.",
  },
  {
    match: /ملابس|أزياء|ازياء/,
    image: "/story/rail-shadow.webp",
    alt: "علّاقات خشبية على راف ملابس وظلّه على الجدار",
    imagePosition: "64% 50%",
    title: "ملابس",
    body: "قطعٌ لليوم العادي، وأخرى للمناسبة.",
    linkAll: true,
  },
  {
    match: /احذية|أحذية/,
    image: "/story/sandals-wall.webp",
    alt: "صندل جلدي وبنطال أبيض أمام جدار بلون الرمل",
    imagePosition: "50% 70%",
    title: "أحذية",
    body: "خطوةٌ مريحة، حتى في حرّ الظهيرة.",
  },
];

function DeptLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="sf-focus text-sf-ink border-sf-ink/25 hover:border-sf-accent hover:text-sf-accent inline-flex items-center gap-2 border-b pt-1.5 pb-2 text-sm font-medium transition-colors"
    >
      {label}
      <svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        className="h-3.5 w-3.5 rtl:rotate-180"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 3l5 5-5 5" />
      </svg>
    </Link>
  );
}

/** Top-level departments first, de-duplicated by name. */
function departmentsMatching(categories: StorefrontCategory[], match: RegExp) {
  const seen = new Set<string>();
  return [...categories]
    .sort((a, b) => Number(a.parentId !== null) - Number(b.parentId !== null))
    .filter((c) => {
      const key = c.name.trim();
      if (!match.test(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function StoryDiscovery({
  categories,
}: {
  categories: StorefrontCategory[];
}) {
  const beats: ChapterBeat[] = [];

  for (const frame of FRAMES) {
    const found = departmentsMatching(categories, frame.match);
    if (found.length === 0) continue;
    // Top-level departments only for the links when any exist — "أحذية
    // رجالية" is a subcategory of men's clothing and would be a second,
    // narrower door into the same frame.
    const roots = found.filter((c) => c.parentId === null);
    const linked = frame.linkAll ? (roots.length ? roots : found) : [roots[0] ?? found[0]];

    beats.push({
      image: frame.image,
      alt: frame.alt,
      imagePosition: frame.imagePosition,
      title: frame.title ?? linked[0].name,
      body: frame.body,
      footer: (
        <div className="flex flex-wrap gap-x-7 gap-y-3">
          {linked.map((c) => (
            <DeptLink
              key={c.id}
              href={routes.category(c.id)}
              label={linked.length > 1 ? c.name : `تسوّق ${c.name}`}
            />
          ))}
        </div>
      ),
    });
  }

  if (beats.length === 0) return null;

  return (
    <Chapter
      id="chapter-departments"
      name="الأقسام"
      layout="panel"
      grade
      beats={beats}
    />
  );
}
