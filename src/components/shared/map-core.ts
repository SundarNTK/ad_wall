import type * as LeafletNS from "leaflet";

export type Leaflet = typeof LeafletNS;

export const SATELLITE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
export const LABELS_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";
export const ATTRIBUTION = "Imagery &copy; Esri, Maxar, Earthstar Geographics";

export async function loadLeaflet(): Promise<Leaflet> {
  const mod = (await import("leaflet")) as unknown as { default?: Leaflet } & Leaflet;
  return mod.default || mod;
}

/** Satellite imagery with a light place-name overlay (hybrid look). */
export function addSatellite(L: Leaflet, map: LeafletNS.Map) {
  L.tileLayer(SATELLITE_URL, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(map);
  L.tileLayer(LABELS_URL, { maxZoom: 19, opacity: 0.9 }).addTo(map);
}

export function pinIcon(L: Leaflet) {
  const html = `
    <svg width="38" height="48" viewBox="0 0 38 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs><linearGradient id="adwallPin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8b5cf6"/><stop offset="1" stop-color="#4f46e5"/></linearGradient></defs>
      <path d="M19 1C9.6 1 2 8.4 2 17.6c0 12.2 14.2 27.6 16.1 29.6.5.5 1.3.5 1.8 0C21.8 45.2 36 29.8 36 17.6 36 8.4 28.4 1 19 1z" fill="url(#adwallPin)" stroke="#ffffff" stroke-width="2.5"/>
      <circle cx="19" cy="17.5" r="6.2" fill="#ffffff"/>
    </svg>`;
  return L.divIcon({ className: "adwall-pin", html, iconSize: [38, 48], iconAnchor: [19, 46] });
}
