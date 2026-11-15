import type { ApiResult } from "@/types";

const FIELD_LABELS: Record<string, string> = {
  categoryId: "Category", subCategoryId: "Subcategory", title: "Title", description: "Description", price: "Price", priceType: "Price type",
  images: "Photos", contactName: "Contact name", contactEmail: "Contact email", contactPhone: "Phone", locationId: "Location", city: "City", zip: "ZIP",
  durationDays: "Ad duration", lat: "Map pin", lng: "Map pin", email: "Email", password: "Password", confirmPassword: "Confirm password", name: "Name",
  phone: "Phone", message: "Message", fromName: "Your name", fromEmail: "Your email", body: "Message", type: "Type", comment: "Comment", acceptTerms: "Terms",
  slug: "Slug", label: "Label", days: "Days", word: "Word", key: "Key", question: "Question", answer: "Answer", content: "Content", state: "State", country: "Country",
};

const STATUS_HINTS: Record<number, string> = {
  401: "Your session has expired. Please sign in again.",
  403: "You do not have permission to do that.",
  404: "We could not find what you were looking for. It may have been removed.",
  409: "This conflicts with something that already exists.",
  413: "That file is too large.",
  429: "Too many attempts. Please wait a minute and try again.",
  500: "Something went wrong on our side. Please try again in a moment.",
  502: "The service is temporarily unavailable. Please try again shortly.",
  503: "The service is temporarily unavailable. Please try again shortly.",
};

function labelFor(key: string) {
  const last = key.split(".").pop() || key;
  return FIELD_LABELS[key] || FIELD_LABELS[last] || last.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

/** Turns an error response into a sentence that says what to fix. */
export function explainError(message: string, errors?: Record<string, string>, status?: number) {
  const items = errors ? Object.entries(errors).filter(([, text]) => text) : [];
  if (items.length) {
    const seen = new Set<string>();
    const parts: string[] = [];
    for (const [key, text] of items) {
      const label = labelFor(key);
      const line = /required|invalid|expected|must|enter|choose|add|use|too|include|remove|maximum|accept/i.test(text) && text.toLowerCase().startsWith(label.toLowerCase()) ? text : `${label}: ${text}`;
      if (!seen.has(line)) {
        seen.add(line);
        parts.push(line);
      }
    }
    const shown = parts.slice(0, 4).join(" · ");
    return `Please fix the following: ${shown}${parts.length > 4 ? ` · and ${parts.length - 4} more` : ""}`;
  }
  const generic = !message || /^(check the form|unexpected server response|error|failed)$/i.test(message.trim());
  if (generic && status && STATUS_HINTS[status]) return STATUS_HINTS[status];
  if (generic) return "We could not complete that. Please check what you entered and try again.";
  return message;
}

export async function api<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  const headers = new Headers(init?.headers);
  if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  let response: Response;
  try {
    response = await fetch(url, { ...init, headers });
  } catch {
    return { success: false, message: "Cannot reach the server. Check your internet connection and try again." };
  }
  const body = (await response.json().catch(() => ({ success: false, message: "" }))) as ApiResult<T>;
  if (!body.success) body.message = explainError(body.message, body.errors, response.status);
  return body;
}

export function priceLabel(price: number, type: string) {
  if (type === "free") return "Free";
  if (type === "contact") return "Contact";
  const formatted = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(price || 0);
  return type === "negotiable" ? `${formatted} · negotiable` : formatted;
}

export function when(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}
