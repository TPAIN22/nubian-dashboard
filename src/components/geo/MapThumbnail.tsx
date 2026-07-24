"use client";

/**
 * A map preview built from plain tile `<img>` elements.
 *
 * ## Why not a map library
 *
 * The dashboard's CSP (`next.config.ts`) allows `img-src ... https:` but only
 * allowlisted script origins, so pulling Leaflet/MapLibre from a CDN — or
 * running one inside a `srcdoc` iframe, which inherits the parent CSP — is
 * blocked. Rather than punch a hole in the CSP for a read-only thumbnail, the
 * tiles are laid out directly with slippy-map arithmetic. No JS dependency, no
 * CSP change, and it works with whatever tile source the backend is configured
 * with.
 *
 * When the active provider offers static map images, the backend proxy
 * (`/api/geo/static`) is used instead — one request, better labelling, and the
 * vendor key stays server-side.
 */
import { useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GeoConfig } from "@/lib/geo";
import { toApiUrl } from "@/lib/geo";

const TILE_SIZE = 256;

interface Props {
  latitude: number | null;
  longitude: number | null;
  config: GeoConfig;
  width?: number;
  height?: number;
  zoom?: number;
  className?: string;
}

/** Slippy-map projection: lat/lng → fractional tile coordinates at `zoom`. */
const project = (lat: number, lng: number, zoom: number) => {
  const n = 2 ** zoom;
  const latRad = (lat * Math.PI) / 180;

  return {
    x: ((lng + 180) / 360) * n,
    y: ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
  };
};

const buildTileUrl = (template: string, x: number, y: number, z: number) =>
  template
    .replace("{z}", String(z))
    .replace("{x}", String(x))
    .replace("{y}", String(y))
    // Some templates use a {s} subdomain slot; pin it so the URL is stable
    // and the browser can cache it.
    .replace("{s}", "a");

export function MapThumbnail({
  latitude,
  longitude,
  config,
  width = 320,
  height = 160,
  zoom = 15,
  className,
}: Props) {
  const [staticFailed, setStaticFailed] = useState(false);

  const hasPin =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  const tiles = useMemo(() => {
    if (!hasPin || !config.tileUrl) return null;

    const z = Math.min(zoom, config.maxZoom);
    const center = project(latitude as number, longitude as number, z);

    // Pixel bounds of the viewport in world-pixel space, centred on the pin.
    const left = center.x * TILE_SIZE - width / 2;
    const top = center.y * TILE_SIZE - height / 2;

    const firstX = Math.floor(left / TILE_SIZE);
    const lastX = Math.floor((left + width) / TILE_SIZE);
    const firstY = Math.floor(top / TILE_SIZE);
    const lastY = Math.floor((top + height) / TILE_SIZE);

    const n = 2 ** z;
    const out: { key: string; url: string; left: number; top: number }[] = [];

    for (let tx = firstX; tx <= lastX; tx += 1) {
      for (let ty = firstY; ty <= lastY; ty += 1) {
        // Rows outside the projection don't exist; columns wrap around.
        if (ty < 0 || ty >= n) continue;
        const wrappedX = ((tx % n) + n) % n;

        out.push({
          key: `${z}/${tx}/${ty}`,
          url: buildTileUrl(config.tileUrl, wrappedX, ty, z),
          left: tx * TILE_SIZE - left,
          top: ty * TILE_SIZE - top,
        });
      }
    }

    return out;
  }, [hasPin, latitude, longitude, zoom, width, height, config.tileUrl, config.maxZoom]);

  if (!hasPin) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed bg-muted/40 text-muted-foreground",
          className,
        )}
        style={{ width, height }}
      >
        <MapPin className="h-4 w-4" aria-hidden />
        <span className="text-[11px]">لا يوجد موقع على الخريطة</span>
      </div>
    );
  }

  // Preferred path: one static image from the backend proxy.
  if (config.capabilities.staticMap && !staticFailed) {
    return (
      <div
        className={cn("relative overflow-hidden rounded-lg border bg-muted", className)}
        style={{ width, height }}
      >
        {/* Deliberately a plain <img>, not next/image: the source is our own
            API proxy, not a configured remote pattern, and it is already
            correctly sized and cached by the backend. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={toApiUrl(
            `/api/geo/static?lat=${latitude}&lng=${longitude}&zoom=${zoom}&width=${width}&height=${height}`,
          )}
          alt={`خريطة الموقع ${latitude}، ${longitude}`}
          width={width}
          height={height}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setStaticFailed(true)}
        />
      </div>
    );
  }

  if (!tiles || tiles.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-1 rounded-lg border bg-muted/40 text-muted-foreground",
          className,
        )}
        style={{ width, height }}
      >
        <MapPin className="h-4 w-4" aria-hidden />
        <span className="font-mono text-[11px]">
          {(latitude as number).toFixed(5)}, {(longitude as number).toFixed(5)}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn("relative overflow-hidden rounded-lg border bg-muted", className)}
      style={{ width, height }}
      role="img"
      aria-label={`خريطة الموقع ${latitude}، ${longitude}`}
    >
      {tiles.map((tile) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={tile.key}
          src={tile.url}
          alt=""
          aria-hidden
          width={TILE_SIZE}
          height={TILE_SIZE}
          loading="lazy"
          draggable={false}
          className="pointer-events-none absolute max-w-none select-none"
          style={{ left: tile.left, top: tile.top }}
        />
      ))}

      {/* Centre pin. The tile mosaic is centred on the coordinate, so dead
          centre is the exact location. */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <MapPin
          className="h-6 w-6 -translate-y-2 fill-red-500 text-red-600 drop-shadow"
          aria-hidden
        />
      </div>

      {config.attribution ? (
        <span className="absolute bottom-0 right-0 bg-background/70 px-1 text-[8px] leading-tight text-muted-foreground">
          {config.attribution}
        </span>
      ) : null}
    </div>
  );
}

export default MapThumbnail;
