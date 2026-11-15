import { Editorial, editorialMetadata } from "@/components/customer/editorial";
export const metadata = editorialMetadata("terms");
export default function Page() { return <Editorial slug="terms" />; }
