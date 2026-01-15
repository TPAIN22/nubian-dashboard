import type { NormalizedProduct } from "./product.normalize";
import { isVariantSelectable } from "./product.guards";

export type SelectedAttributes = Record<string, string>;

const normKey = (k: any) => String(k ?? "").trim().toLowerCase();
const normVal = (v: any) => String(v ?? "").trim();

export function normalizeSelectedAttributes(input: any): SelectedAttributes {
  if (!input || typeof input !== "object") return {};
  const out: SelectedAttributes = {};
  for (const [k, v] of Object.entries(input)) {
    const key = normKey(k);
    const val = normVal(v);
    if (key && val) out[key] = val;
  }
  return out;
}

export function getAttributeOptions(p: NormalizedProduct): Record<string, string[]> {
  const options: Record<string, Set<string>> = {};

  for (const def of p.attributeDefs) {
    const key = normKey(def.name);
    if (!key) continue;
    options[key] = options[key] || new Set<string>();
    for (const opt of def.options || []) {
      const v = normVal(opt);
      if (v) options[key].add(v);
    }
  }

  for (const v of p.variants) {
    if (!isVariantSelectable(v)) continue;
    for (const [k, raw] of Object.entries(v.attributes || {})) {
      const key = normKey(k);
      const val = normVal(raw);
      if (!key || !val) continue;
      options[key] = options[key] || new Set<string>();
      options[key].add(val);
    }
  }

  const out: Record<string, string[]> = {};
  for (const [k, set] of Object.entries(options)) out[k] = Array.from(set);
  return out;
}

