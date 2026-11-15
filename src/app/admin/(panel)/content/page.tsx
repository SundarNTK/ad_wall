import { MasterPanel } from "@/components/admin/panels";
export default function Page() {
  return (
    <div className="space-y-10">
      <MasterPanel resource="pages" title="Static pages" sample={'{\n  "slug": "about",\n  "title": "About",\n  "content": "Tell visitors who you are.",\n  "order": 1,\n  "isActive": true\n}'} />
      <MasterPanel resource="faqs" title="FAQ" sample={'{\n  "question": "How do renewals work?",\n  "answer": "Renew is available during the last 3 days before expiry.",\n  "order": 4,\n  "isActive": true\n}'} />
    </div>
  );
}
