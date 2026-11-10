# Story assets — manifest

Campaign stills for the homepage (`src/components/storefront/story/`).

## Art direction

**Hard Sudanese daylight on objects.** Every frame is an object or a surface
in raking afternoon sun: long shadows on stone, plaster and cloth; amber,
sand and ink; no studio sweep, no scenery. One warm soft-light grade
(`.sf-grade` in `globals.css`) is laid over all of them so four photographers
read as one shoot.

The direction was chosen from the catalogue up, not imposed on it: the
strongest merchant photography already live on Nubian (the amber bottle on
sand ripples, the green bottle on stone under a palm frond) is shot in exactly
this light. So the campaign hands over to real products without a change of
world.

What it deliberately avoids: desert panoramas and heritage monuments as a
stand-in for "Sudanese". Relevance comes from the light, the materials and
the people's own clothing — not from postcard landmarks.

## Licensed stills — all Unsplash License (free for commercial use)

Verified on each photo page as "Free to use under the Unsplash License"
(not Unsplash+). Files were taken from the Unsplash image CDN and are stored
here, so the page never depends on a third-party URL at runtime.

| File | Used in | Unsplash page | Photographer | Size |
|---|---|---|---|---|
| `amber-light.jpg` | Opening frame (LCP) | https://unsplash.com/photos/MLV5zTSzj98 | Simply Mersah (@simplymersah) | 1800×3199 |
| `bottle-shadow.jpg` | Departments · عطور | https://unsplash.com/photos/RUPxcOsyQI4 | mae black (@maeblack) | 1800×2700 |
| `rail-shadow.jpg` | Departments · ملابس | https://unsplash.com/photos/giTULmSIQ6E | Ivy (@ivyesque) | 2400×1485 |
| `sandals-wall.jpg` | Departments · أحذية | https://unsplash.com/photos/LyJAczPSwo0 | DCL "650" (@dclmister) | 1800×2250 |
| `palm-plaster.jpg` | Closing frame | https://unsplash.com/photos/yhtATNbV05g | Mavi Atlas (@maviatlas) | 1800×2811 |

Crops are set in code (`objectPosition`), not baked into the files:

- **amber-light** — `50% 42%`. Portrait; fills the image half of the split
  opening on desktop and a 52svh band on phones. Bottle stays whole in both.
- **bottle-shadow** — `50% 55%`. The shadow is the subject; it stays centred.
- **rail-shadow** — `64% 50%`. The only landscape still; cropped to the
  rail's right half in the tall panel. Coolest of the set before grading.
- **sandals-wall** — `50% 70%`. Keeps both sandals and the hem in frame.
- **palm-plaster** — mirrored, `50% 24%`, masked into a flat `#C1A47C` ground
  sampled from its own plaster, so copy never sits on a frond.

### Brand and release checks

- No third-party marks. Several stronger perfume photographs in the search
  were recognisable designer bottles (Chanel, Dior, Gucci, YSL) and were
  rejected for that reason alone.
- No identifiable faces. The Unsplash License grants no model release;
  `sandals-wall.jpg` shows feet and trousers only.
- No false place claims. A strong shopfront still (Ting Chen, `c78aSqTEJUo`)
  was rejected after its page placed it in Chiang Mai, Thailand — pairing it
  with copy about Sudanese merchants would have implied something untrue.

## Retired

| File | Source | Why |
|---|---|---|
| `chapter-desire.jpg` (deleted) | https://unsplash.com/photos/4cloovdyuvw — Fabian Struwe | A dune sunset says nothing about shopping, and its muddy orange grade matched no other frame. |
| `chapter-connection.jpg` (deleted) | https://unsplash.com/photos/33o_TBUL9IM — Jillian Amatt | The Meroë pyramids as the brand's closing statement leaned on heritage imagery; blue-sky daylight grade clashed with the rest. |

## Live imagery (not stored here)

Products, collection covers and merchant logos are Nubian's own, served from
ImageKit through the backend and never graded. Department pages still use
their uploaded category art; the homepage no longer does (see
`StoryDiscovery.tsx` and `HomeCategories.tsx` for why).

## Still missing

1. **A commissioned shoot.** These are good stock, but stock: anyone can
   license the same frames. The direction is written so a Sudanese
   photographer could shoot it in a day — merchants' real goods, on real
   walls, in real afternoon light. That shoot would replace all five files
   one-for-one with no code changes.
2. **Accessories.** No unbranded still in this light was strong enough, so
   the departments chapter has three frames, not four. `اكسسوارات` is still
   one tap away in the department index and the header.
3. **Merchant product photography.** Roughly a third of the live feed is
   handheld phone photos taken in shops. No CSS fixes that; a short photo
   guide for merchants (light, background, 4:5 crop) would.

## Category art replaced (database, not this folder)

| Category | Was | Now | Source |
|---|---|---|---|
| سجائر وشيشة (`6aa91f4af48ee47ccaa8650f`) | `https://ik.imagekit.io/nubian/57679_9j-0dbCeA.jpg` — a third-party "NABLES" logo with a transparency checkerboard and a blurred watermark band baked into the pixels | `https://ik.imagekit.io/nubian/category-shisha-coal_fBtHOfXBD.jpg` (1600×1067) | https://unsplash.com/photos/Ke6eNtGG018 — Wesley Balten (@arcsigne), Unsplash License (verified free, not Unsplash+) |

A hookah bowl with one lit coal in warm amber light: unbranded, no people,
same palette as the campaign. Uploaded to Nubian's ImageKit and written to
the category's `image` field, so the admin panel and the mobile app see it
too. To roll back, set `image` back to the "Was" URL in
`/admin/categories/edit`.
