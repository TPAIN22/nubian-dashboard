/**
 * Dashboard geo client — the browser mirror of the backend's provider-neutral
 * geo layer.
 *
 * The dashboard never holds a map vendor key and never calls a vendor directly.
 * Tile URLs, attribution and capabilities all arrive from `/api/geo/config`, so
 * changing map provider is a backend env change that this code doesn't notice.
 */
import { axiosInstance } from "./axiosInstance";

export interface GeoCapabilities {
  reverseGeocode: boolean;
  forwardGeocode: boolean;
  autocomplete: boolean;
  placeDetails: boolean;
  staticMap: boolean;
}

export interface GeoConfig {
  provider: string;
  styleUrl: string | null;
  tileUrl: string | null;
  attribution: string;
  maxZoom: number;
  defaultCenter: { lat: number; lng: number };
  defaultZoom: number;
  capabilities: GeoCapabilities;
  countryCodes: string[];
}

export const FALLBACK_GEO_CONFIG: GeoConfig = {
  provider: "none",
  styleUrl: null,
  tileUrl: null,
  attribution: "",
  maxZoom: 19,
  defaultCenter: { lat: 15.5007, lng: 32.5599 },
  defaultZoom: 15,
  capabilities: {
    reverseGeocode: false,
    forwardGeocode: false,
    autocomplete: false,
    placeDetails: false,
    staticMap: false,
  },
  countryCodes: [],
};

/** One row of the admin address table, already flattened by the backend. */
export interface AdminAddressRow {
  _id: string;
  user?: { _id: string; name?: string; email?: string; phoneNumber?: string } | string | null;
  name: string;
  phone: string;
  whatsapp: string;

  latitude: number | null;
  longitude: number | null;
  hasCoordinates: boolean;

  formattedAddress: string;
  city: string;
  country: string;
  countryCode: string;
  administrativeArea: string;
  neighborhood: string;
  postalCode: string;

  building: string;
  floor: string;
  apartment: string;
  landmark: string;
  notes: string;

  placeId: string;
  /** Open Location Code, when the active provider exposes one. Optional. */
  plusCode: string;

  addressLabel: string;
  locationSource: string;
  /** high | medium | low — server-derived, never client-asserted. */
  addressConfidence: string;
  geocodeAccuracy: string;
  locationAccuracyMeters: number | null;
  isDefault: boolean;
  isLegacy: boolean;
  schemaVersion: number;

  /** API-relative path to the static map proxy; null when there's no pin. */
  mapPreviewUrl: string | null;

  createdAt?: string;
  updatedAt?: string;
}

export interface AdminAddressQuery {
  search?: string;
  countryCode?: string;
  city?: string;
  label?: string;
  hasCoordinates?: boolean;
  isLegacy?: boolean;
  sortBy?: "createdAt" | "updatedAt" | "city" | "countryCode" | "name";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface AdminAddressStats {
  total: number;
  withCoordinates: number;
  withoutCoordinates: number;
  legacy: number;
  migratedPct: number;
  byLabel: Record<string, number>;
  topCities: { city: string; count: number }[];
}

export const fetchGeoConfig = async (): Promise<GeoConfig> => {
  try {
    const res = await axiosInstance.get("/geo/config");
    return { ...FALLBACK_GEO_CONFIG, ...(res.data?.data ?? {}) };
  } catch {
    // A missing map config must never blank the admin table — the rows are
    // still perfectly readable without a thumbnail.
    return FALLBACK_GEO_CONFIG;
  }
};

export const fetchAdminAddresses = async (
  query: AdminAddressQuery,
): Promise<{ rows: AdminAddressRow[]; total: number; totalPages: number }> => {
  // Drop empty filters so the request URL reflects only what's actually applied.
  const params = Object.fromEntries(
    Object.entries(query).filter(([, v]) => v !== undefined && v !== "" && v !== null),
  );

  const res = await axiosInstance.get("/admin/addresses", { params });

  return {
    rows: res.data?.data ?? [],
    total: res.data?.meta?.pagination?.total ?? 0,
    totalPages: res.data?.meta?.pagination?.totalPages ?? 0,
  };
};

export const fetchAdminAddressStats = async (): Promise<AdminAddressStats | null> => {
  try {
    const res = await axiosInstance.get("/admin/addresses/stats");
    return res.data?.data ?? null;
  } catch {
    return null;
  }
};

/** Absolute URL for an API-relative path returned by the backend. */
export const toApiUrl = (path: string): string => {
  const base = (axiosInstance.defaults.baseURL ?? "").replace(/\/api$/, "");
  return `${base}${path}`;
};
