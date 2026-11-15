import { Editorial, editorialMetadata } from "@/components/customer/editorial";
export const metadata = editorialMetadata("about");
export default function Page() { return <Editorial slug="about" />; }
