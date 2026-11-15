"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { ExternalLink } from "lucide-react";
import { addSatellite, loadLeaflet, pinIcon } from "@/components/shared/map-core";

/** Read-only satellite map with the pin an ad owner chose. */
export function MapView({ lat, lng, className = "h-64" }: { lat: number; lng: number; className?: string }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: import("leaflet").Map | null = null;
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !box.current) return;
      map = L.map(box.current, { center: [lat, lng], zoom: 16, scrollWheelZoom: false, attributionControl: true });
      addSatellite(L, map);
      L.marker([lat, lng], { icon: pinIcon(L), keyboard: false }).addTo(map);
      setTimeout(() => map?.invalidateSize(), 250);
    });
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [lat, lng]);

  return (
    <div>
      <div className={`relative isolate z-0 overflow-hidden rounded-2xl border shadow-soft ${className}`}>
        <div ref={box} className="h-full w-full" />
      </div>
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Open in Google Maps <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
