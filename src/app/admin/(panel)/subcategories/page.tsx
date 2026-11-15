import { MasterPanel } from "@/components/admin/panels";
export default function Page() {
  return <MasterPanel resource="subcategories" title="Sub categories" sample={'{\n  "category": "CATEGORY_ID",\n  "name": "Boats",\n  "order": 5,\n  "isActive": true,\n  "fields": [{ "key": "year", "label": "Year", "type": "number", "options": [], "required": false, "filterable": true }]\n}'} />;
}
