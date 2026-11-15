import { MasterPanel } from "@/components/admin/panels";
export default function Page() {
  return <MasterPanel resource="locations" title="Locations" sample={'{\n  "country": "USA",\n  "state": "Utah",\n  "city": "Salt Lake City",\n  "zip": "84101",\n  "lat": 40.76,\n  "lng": -111.89,\n  "isActive": true\n}'} />;
}
