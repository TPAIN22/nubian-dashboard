/**
 * Platform pricing configuration.
 *
 * `NEXT_PUBLIC_NUBIAN_MARKUP` is the single knob for the dashboard's copy of
 * Nubian's default margin — the percentage added on top of a merchant's price.
 * Set it in `.env.local` and rebuild; no code edit anywhere else.
 *
 * The backend owns the real number (`NUBIAN_MARKUP`, see
 * apps/backend/src/lib/pricing.config.js). This mirror is used for exactly two
 * things, both of which are guesses the backend hasn't answered:
 *   1. the markup pre-filled into the product forms before it's saved, and
 *   2. the local price fallback for legacy payloads that arrived un-enriched.
 * Enriched backend prices always win. Keep the two values in sync — mobile has
 * a third copy (`EXPO_PUBLIC_NUBIAN_MARKUP`, constants/pricing.ts).
 *
 * Must stay `NEXT_PUBLIC_` — the product forms and pricing resolver run in the
 * browser. Next inlines it at build time, so it is read via a literal
 * `process.env.NEXT_PUBLIC_NUBIAN_MARKUP` reference and not a computed key.
 */

/** Used when NEXT_PUBLIC_NUBIAN_MARKUP is unset or unusable. */
export const NUBIAN_MARKUP_FALLBACK = 30;

/** Bounds mirror the backend's `nubianMarkup` schema constraints. */
export const NUBIAN_MARKUP_MIN = 0;
export const NUBIAN_MARKUP_MAX = 200;

function resolveDefaultMarkup(): number {
  const raw = process.env.NEXT_PUBLIC_NUBIAN_MARKUP;
  if (raw === undefined || raw.trim() === "") return NUBIAN_MARKUP_FALLBACK;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < NUBIAN_MARKUP_MIN || parsed > NUBIAN_MARKUP_MAX) {
    console.warn(
      `[pricing] NEXT_PUBLIC_NUBIAN_MARKUP="${raw}" is not a number between ` +
        `${NUBIAN_MARKUP_MIN} and ${NUBIAN_MARKUP_MAX} — using ${NUBIAN_MARKUP_FALLBACK}%.`,
    );
    return NUBIAN_MARKUP_FALLBACK;
  }
  return parsed;
}

/** Default Nubian margin, in percent. */
export const DEFAULT_NUBIAN_MARKUP = resolveDefaultMarkup();
