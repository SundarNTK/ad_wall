import { MasterPanel } from "@/components/admin/panels";
export default function Page() {
  return <MasterPanel resource="keywords" title="Prohibited keywords" sample={'{\n  "word": "counterfeit",\n  "isActive": true\n}'} />;
}
