export type FieldDef = {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  options?: string[];
  required?: boolean;
  filterable?: boolean;
};

export type PublicAd = {
  id: string;
  adNumber: number;
  title: string;
  slug: string;
  description: string;
  price: number;
  priceType: "fixed" | "negotiable" | "free" | "contact" | string;
  attributes: Record<string, string | number>;
  images: { url: string; publicId?: string }[];
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  showPhone?: boolean;
  city?: string;
  zip?: string;
  lat?: number | null;
  lng?: number | null;
  status?: string;
  rejectReason?: string;
  expiresAt?: string | null;
  renewedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  views?: number;
  isPrivateSeller?: boolean;
  isFeatured?: boolean;
  durationDays?: number;
  userId?: string;
  category?: { id: string; name: string; slug: string; icon?: string } | null;
  subCategory?: { id: string; name: string; slug: string; fields?: FieldDef[] } | null;
  location?: { id: string; city: string; state: string; country?: string; slug: string } | null;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "admin" | "superadmin";
  status: string;
  emailVerified: boolean;
  avatar: string;
};

export type ApiResult<T> = { success: boolean; message: string; errors?: Record<string, string>; data?: T };
