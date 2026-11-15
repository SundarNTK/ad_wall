import { MasterPanel } from "@/components/admin/panels";
export default function Page() {
  return <MasterPanel resource="expiry" title="Ad expiry options" sample={'{\n  "label": "1 week",\n  "days": 7,\n  "order": 1,\n  "isDefault": false,\n  "isActive": true\n}'} />;
}
