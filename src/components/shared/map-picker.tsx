"use client";

import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { Crosshair, Loader2, MapPin, Search } from "lucide-react";
import { addSatellite, loadLeaflet, pinIcon, type Leaflet } from "@/components/shared/map-core";

type Point = { lat: number; lng: number };
export type Place = { city?: string; zip?: string; label: string };

type Hit = { display_name: string; lat: string; lon: string };
type Reverse = { display_name?: string; address?: Record<string, string> };

const NOMINATIM = "https://nominatim.openstreetmap.org";

function placeFrom(data: Reverse): Place {
  const a = data.address || {};
  return {
    city: a.city || a.town || a.village || a.suburb || a.county || undefined,
    zip: a.postcode || undefined,
    label: data.display_name || "",
  };
}

/**
 * Satellite map for choosing an exact place: click the map, drag the pin, search an address, or use your location.
 * `center` is where the map opens when no pin is set yet.
 */
export function MapPicker({
  value,
  center,
  onChange,
  onPlace,
}: {
  value: Point | null;
  center: Point;
  onChange: (point: Point | null) => void;
  onPlace?: (place: Place) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const leafletRef = useRef<Leaflet | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const changeRef = useRef(onChange);
  const placeRef = useRef(onPlace);
  changeRef.current = onChange;
  placeRef.current = onPlace;

  const [label, setLabel] = useState("");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const reverse = useCallback((point: Point) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const response = await fetch(`${NOMINATIM}/reverse?format=jsonv2&addressdetails=1&zoom=16&lat=${point.lat}&lon=${point.lng}`, { headers: { Accept: "application/json" } });
        const found = placeFrom((await response.json()) as Reverse);
        setLabel(found.label);
        placeRef.current?.(found);
      } catch {
        setLabel("");
      }
    }, 600);
  }, []);

  const place = useCallback(
    (point: Point, zoom?: number) => {
      const L = leafletRef.current;
      const map = mapRef.current;
      if (!L || !map) return;
      if (!markerRef.current) {
        const marker = L.marker([point.lat, point.lng], { icon: pinIcon(L), draggable: true, autoPan: true });
        marker.on("dragend", () => {
          const at = marker.getLatLng();
          const next = { lat: Number(at.lat.toFixed(6)), lng: Number(at.lng.toFixed(6)) };
          changeRef.current(next);
          reverse(next);
        });
        marker.addTo(map);
        markerRef.current = marker;
      } else {
        markerRef.current.setLatLng([point.lat, point.lng]);
      }
      if (zoom) map.setView([point.lat, point.lng], zoom, { animate: true });
    },
    [reverse],
  );

  // create the map once
  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !box.current) return;
      leafletRef.current = L;
      const start = value || center;
      const map = L.map(box.current, { center: [start.lat, start.lng], zoom: value ? 16 : 12, scrollWheelZoom: true });
      mapRef.current = map;
      addSatellite(L, map);
      if (value) place(value);
      map.on("click", (event) => {
        const next = { lat: Number(event.latlng.lat.toFixed(6)), lng: Number(event.latlng.lng.toFixed(6)) };
        place(next);
        changeRef.current(next);
        reverse(next);
      });
      const fix = () => map.invalidateSize();
      setTimeout(fix, 300);
      setTimeout(fix, 900);
    });
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // when the chosen location (city) changes and no pin is set, move the map there
  useEffect(() => {
    if (!value && mapRef.current) mapRef.current.setView([center.lat, center.lng], 12, { animate: true });
  }, [center.lat, center.lng, value]);

  async function search() {
    const text = query.trim();
    if (text.length < 3) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${NOMINATIM}/search?format=jsonv2&limit=5&q=${encodeURIComponent(text)}`, { headers: { Accept: "application/json" } });
      const rows = (await response.json()) as Hit[];
      setHits(rows);
      if (!rows.length) setError("No place found. Try a landmark or a wider area.");
    } catch {
      setError("Search is unavailable right now. Click the map to place the pin.");
    }
    setBusy(false);
  }

  function pick(hit: Hit) {
    const next = { lat: Number(Number(hit.lat).toFixed(6)), lng: Number(Number(hit.lon).toFixed(6)) };
    setHits([]);
    place(next, 17);
    onChange(next);
    reverse(next);
  }

  function locate() {
    if (!navigator.geolocation) {
      setError("Location is not available in this browser.");
      return;
    }
    setBusy(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = { lat: Number(position.coords.latitude.toFixed(6)), lng: Number(position.coords.longitude.toFixed(6)) };
        place(next, 17);
        onChange(next);
        reverse(next);
        setBusy(false);
      },
      () => {
        setError("Could not get your location. Allow location access, or click the map.");
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function clear() {
    markerRef.current?.remove();
    markerRef.current = null;
    setLabel("");
    onChange(null);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                search();
              }
            }}
            placeholder="Search an address or landmark"
            className="w-full rounded-xl border bg-background py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {hits.length > 0 && (
            <ul className="absolute left-0 right-0 top-[calc(100%+6px)] z-[1000] max-h-60 overflow-auto rounded-xl border bg-card p-1.5 shadow-soft">
              {hits.map((hit, index) => (
                <li key={`${hit.lat}-${hit.lon}-${index}`}>
                  <button type="button" onClick={() => pick(hit)} className="flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition hover:bg-primary/10">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="line-clamp-2">{hit.display_name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="button" onClick={search} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Search
        </button>
        <button type="button" onClick={locate} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition hover:bg-muted disabled:opacity-60">
          <Crosshair className="h-4 w-4" /> My location
        </button>
      </div>

      <div className="relative isolate z-0 h-72 overflow-hidden rounded-2xl border shadow-soft">
        <div ref={box} className="h-full w-full" />
        {!value && (
          <div className="pointer-events-none absolute inset-x-0 top-3 z-[500] flex justify-center">
            <span className="rounded-full bg-black/60 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur">Click the map to drop your pin</span>
          </div>
        )}
      </div>

      <div className="flex min-h-5 flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        {error ? (
          <span className="text-danger">{error}</span>
        ) : value ? (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span className="line-clamp-1">{label || `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`}</span>
          </span>
        ) : (
          <span>Optional. Buyers will see this place on a satellite map.</span>
        )}
        {value && (
          <button type="button" onClick={clear} className="font-medium text-primary hover:underline">
            Remove pin
          </button>
        )}
      </div>
    </div>
  );
}
