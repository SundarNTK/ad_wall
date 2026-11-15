import { MasterPanel } from "@/components/admin/panels";
export default function Page() {
  return <MasterPanel resource="categories" title="Categories" sample={'{\n  "name": "Announcements",\n  "icon": "Tag",\n  "order": 9,\n  "isActive": true\n}'} />;
}
