"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap, Marker, MapMouseEvent } from "maplibre-gl";
// Imported here rather than in globals.css: a bare-module specifier in a CSS
// @import is not resolved by the build, so it was dropped silently and the
// bundle shipped with no .maplibregl-* rules at all. The canvas then had no
// layout and the map rendered as an empty box. Next bundles CSS imported from
// a client component, so this is the supported path.
import "maplibre-gl/dist/maplibre-gl.css";
import { MapPin, Crosshair, Trash2, Check } from "lucide-react";
import { setRestaurantCoordinates } from "@/lib/actions/admin";

/**
 * Click-to-place pin for setting a restaurant's coordinates by hand.
 *
 * Chosen over paid bulk geocoding: a person confirming each location produces
 * better data than a text search guessing, and it costs nothing. The trade-off
 * is that coverage grows one restaurant at a time.
 *
 * Tiles come from a style URL rather than a hardcoded provider, so swapping to
 * MapTiler or a self-hosted style is a config change. The default needs no key.
 */

const STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "https://tiles.openfreemap.org/styles/liberty";

/** Amman, used as the starting view when a restaurant has no pin yet. */
const DEFAULT_CENTER: [number, number] = [35.9106, 31.9539];

export function PinDropMap({
  restaurantId,
  latitude,
  longitude,
  governorateName,
}: {
  restaurantId: string;
  latitude: number | null;
  longitude: number | null;
  governorateName?: string | null;
}) {
  const t = useTranslations("admin.map");
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const marker = useRef<Marker | null>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    latitude != null && longitude != null ? { lat: latitude, lng: longitude } : null
  );
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  // A map that fails to load its tiles renders as an empty coloured box — the
  // style's background layer paints, nothing else does. Surfacing the reason
  // beats leaving someone staring at a blank square wondering if it is loading.
  const [mapError, setMapError] = useState<string | null>(null);

  // Keep the latest coords available to the map's event handlers without
  // re-creating the map on every change.
  const coordsRef = useRef(coords);
  coordsRef.current = coords;

  useEffect(() => {
    if (!container.current || map.current) return;

    const m = new maplibregl.Map({
      container: container.current,
      style: STYLE_URL,
      center: coordsRef.current ? [coordsRef.current.lng, coordsRef.current.lat] : DEFAULT_CENTER,
      zoom: coordsRef.current ? 15 : 11,
      attributionControl: { compact: true },
    });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    // MapLibre reports tile, style, sprite and glyph failures through this one
    // event. Without a handler it logs to the console and the map just sits
    // there blank.
    m.on("error", (event) => {
      // MapLibre's ErrorEvent type does not expose `status`/`sourceId` on the
      // public signature, though both are present at runtime for tile failures.
      const e = event as unknown as {
        error?: Error & { status?: number };
        sourceId?: string;
      };
      const err = e?.error;
      const parts = [
        err?.status ? `HTTP ${err.status}` : null,
        e?.sourceId ? `source "${e.sourceId}"` : null,
        err?.message,
      ].filter(Boolean);
      const detail = parts.join(" · ") || "Unknown map error";
      setMapError(detail);
      // Keep the full object in the console for anyone debugging further.
      console.error("[map]", detail, e);
    });

    const place = (lng: number, lat: number) => {
      if (marker.current) {
        marker.current.setLngLat([lng, lat]);
      } else {
        const created = new maplibregl.Marker({ color: "#0050a0", draggable: true })
          .setLngLat([lng, lat])
          .addTo(m);
        // Dragging the pin is the fine adjustment after the initial click.
        created.on("dragend", () => {
          const p = created.getLngLat();
          setCoords({ lat: p.lat, lng: p.lng });
          setState("idle");
        });
        marker.current = created;
      }
      setCoords({ lat, lng });
      setState("idle");
    };

    if (coordsRef.current) place(coordsRef.current.lng, coordsRef.current.lat);
    m.on("click", (e: MapMouseEvent) => place(e.lngLat.lng, e.lngLat.lat));

    /**
     * Tell the map its real size once the container has one.
     *
     * MapLibre measures the container at construction. If it is still 0x0 at
     * that moment — which it is here, because the map is built in an effect
     * that can run before the stylesheet giving the div its height has
     * applied — the map computes an empty viewport, decides no tiles are
     * needed to cover it, and never requests any. The style, the TileJSON and
     * the sprites all load fine, so the map looks alive: controls, attribution
     * and markers all render over the style's background layer. It just never
     * draws a single tile.
     *
     * The observer fires as soon as the div gets its height and every time it
     * changes afterwards, which also covers the sidebar collapsing and the
     * window being resized.
     */
    let sized = false;
    const ro = new ResizeObserver(() => {
      m.resize();
      // Restore the intended view the first time the container has a real
      // size. Constructing at 0x0 leaves the transform clamped to the minimum
      // zoom, and resize() only corrects the viewport — it does not put the
      // zoom back. Without this the map comes up showing the whole world with
      // the pin somewhere in the middle of it.
      if (!sized && container.current && container.current.clientWidth > 0) {
        sized = true;
        const c = coordsRef.current;
        m.jumpTo({
          center: c ? [c.lng, c.lat] : DEFAULT_CENTER,
          zoom: c ? 15 : 11,
        });
      }
    });
    ro.observe(container.current);

    map.current = m;
    return () => {
      ro.disconnect();
      m.remove();
      map.current = null;
      marker.current = null;
    };
  }, []);

  async function save() {
    if (!coords) return;
    setState("saving");
    try {
      await setRestaurantCoordinates(restaurantId, coords.lat, coords.lng);
      setState("saved");
    } catch {
      setState("error");
    }
  }

  async function clear() {
    setState("saving");
    try {
      await setRestaurantCoordinates(restaurantId, null, null);
      marker.current?.remove();
      marker.current = null;
      setCoords(null);
      setState("saved");
    } catch {
      setState("error");
    }
  }

  return (
    <div>
      <p className="text-sm text-ink-soft">
        {coords ? t("dragToAdjust") : t("clickToPlace")}
        {governorateName ? ` · ${governorateName}` : ""}
      </p>

      <div className="relative mt-3">
        <div
          ref={container}
          className="h-72 w-full overflow-hidden rounded-xl border border-rule"
          // The map canvas is not keyboard-operable, so the numeric readout and
          // the clear/save controls below are the accessible path.
          role="application"
          aria-label={t("mapLabel")}
        />
        {mapError ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-xl bg-danger-soft/95 px-3 py-2">
            <p className="text-xs font-medium text-danger-text">{t("tilesFailed")}</p>
            <p className="mt-0.5 break-words font-mono text-[11px] text-danger-text/80" dir="ltr">
              {mapError}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {coords ? (
          <span className="tabular inline-flex items-center gap-1.5 rounded-lg bg-surface-2 px-3 py-1.5 text-xs text-ink-soft" dir="ltr">
            <Crosshair className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-faint">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {t("noPin")}
          </span>
        )}

        <button
          type="button"
          onClick={save}
          disabled={!coords || state === "saving"}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {state === "saved" ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
          {state === "saving" ? t("saving") : state === "saved" ? t("saved") : t("savePin")}
        </button>

        {coords ? (
          <button
            type="button"
            onClick={clear}
            disabled={state === "saving"}
            className="inline-flex items-center gap-1.5 rounded-full border border-rule px-4 py-2 text-xs font-semibold text-danger-text transition-colors hover:bg-danger-soft disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            {t("clearPin")}
          </button>
        ) : null}

        <span role="status" aria-live="polite" className="text-xs">
          {state === "error" ? <span className="text-danger-text">{t("saveFailed")}</span> : null}
        </span>
      </div>
    </div>
  );
}
