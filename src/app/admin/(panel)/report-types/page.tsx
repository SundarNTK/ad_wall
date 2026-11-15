import { MasterPanel } from "@/components/admin/panels";
export default function Page() {
  return <MasterPanel resource="report-types" title="Report types" sample={'{\n  "key": "duplicate",\n  "label": "Duplicate",\n  "order": 8,\n  "isActive": true\n}'} />;
}
