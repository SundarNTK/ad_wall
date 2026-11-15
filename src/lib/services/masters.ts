import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Ad } from "@/models/Ad";
import { Category, ExpiryOption, Faq, Keyword, Location, Page, ReportType, SubCategory } from "@/models/Catalog";
import { Report } from "@/models/Engagement";
import { slugify } from "@/lib/utils";
import { sanitizeText } from "@/lib/sanitize";

const text = z.string().trim().min(1).max(120);

export const masterRegistry = {
  categories: {
    model: Category,
    search: ["name"],
    schema: z.object({
      name: text,
      slug: z.string().trim().optional(),
      icon: z.string().trim().default("Tag"),
      order: z.coerce.number().default(0),
      isActive: z.boolean().default(true),
    }),
    prepare(data: { name: string; slug?: string }) {
      return { ...data, slug: slugify(data.slug || data.name) };
    },
    async inUse(id: string) {
      const [sub, ad] = await Promise.all([SubCategory.exists({ category: id }), Ad.exists({ category: id, status: { $ne: "deleted" } })]);
      return Boolean(sub || ad);
    },
  },
  subcategories: {
    model: SubCategory,
    search: ["name"],
    schema: z.object({
      category: z.string().min(1),
      name: text,
      slug: z.string().trim().optional(),
      order: z.coerce.number().default(0),
      isActive: z.boolean().default(true),
      fields: z
        .array(
          z.object({
            key: z.string().regex(/^[a-z][a-z0-9_]{0,30}$/),
            label: z.string().trim().min(1).max(40),
            type: z.enum(["text", "number", "select"]),
            options: z.array(z.string()).default([]),
            required: z.boolean().default(false),
            filterable: z.boolean().default(false),
          }),
        )
        .default([]),
    }),
    prepare(data: { name: string; slug?: string }) {
      return { ...data, slug: slugify(data.slug || data.name) };
    },
    async inUse(id: string) {
      return Boolean(await Ad.exists({ subCategory: id, status: { $ne: "deleted" } }));
    },
  },
  locations: {
    model: Location,
    search: ["city", "state", "zip", "country"],
    schema: z.object({
      country: text,
      state: text,
      city: text,
      zip: z.string().trim().max(12).optional().or(z.literal("")),
      lat: z.coerce.number().default(0),
      lng: z.coerce.number().default(0),
      slug: z.string().optional(),
      isActive: z.boolean().default(true),
    }),
    prepare(data: { city: string; state: string; slug?: string }) {
      return { ...data, slug: slugify(data.slug || `${data.city}-${data.state}`) };
    },
    async inUse(id: string) {
      return Boolean(await Ad.exists({ location: id, status: { $ne: "deleted" } }));
    },
  },
  keywords: {
    model: Keyword,
    search: ["word"],
    schema: z.object({ word: z.string().trim().toLowerCase().min(2).max(60), isActive: z.boolean().default(true) }),
    prepare(data: { word: string }) {
      return { ...data, word: sanitizeText(data.word).toLowerCase() };
    },
    async inUse() {
      return false;
    },
  },
  expiry: {
    model: ExpiryOption,
    search: ["label"],
    schema: z.object({
      label: text,
      days: z.coerce.number().int().positive(),
      order: z.coerce.number().default(0),
      isDefault: z.boolean().default(false),
      isActive: z.boolean().default(true),
    }),
    prepare(data: { isDefault?: boolean }) {
      return data;
    },
    async inUse(id: string) {
      const active = await ExpiryOption.countDocuments({ isActive: true, _id: { $ne: id } });
      return active === 0;
    },
  },
  "report-types": {
    model: ReportType,
    search: ["label", "key"],
    schema: z.object({
      key: z.string().trim().regex(/^[a-z0-9_]{2,40}$/),
      label: text,
      order: z.coerce.number().default(0),
      isActive: z.boolean().default(true),
    }),
    prepare(data: { label: string; key?: string }) {
      return { ...data, key: slugify(data.key || data.label).replace(/-/g, "_") };
    },
    async inUse(id: string) {
      const row = (await ReportType.findById(id).lean()) as { key?: string } | null;
      if (!row?.key) return false;
      return Boolean(await Report.exists({ type: row.key }));
    },
  },
  pages: {
    model: Page,
    search: ["title", "slug"],
    schema: z.object({
      slug: z.string().trim().min(2).max(40),
      title: text,
      content: z.string().max(20000).default(""),
      order: z.coerce.number().default(0),
      isActive: z.boolean().default(true),
    }),
    prepare(data: { title: string; content?: string; slug: string }) {
      return { ...data, slug: slugify(data.slug), title: sanitizeText(data.title), content: sanitizeText(data.content || "") };
    },
    async inUse() {
      return false;
    },
  },
  faqs: {
    model: Faq,
    search: ["question"],
    schema: z.object({
      question: z.string().trim().min(5).max(200),
      answer: z.string().trim().min(5).max(4000),
      order: z.coerce.number().default(0),
      isActive: z.boolean().default(true),
    }),
    prepare(data: { question: string; answer: string; order?: number; isActive?: boolean }) {
      return { ...data, question: sanitizeText(data.question), answer: sanitizeText(data.answer) };
    },
    async inUse() {
      return false;
    },
  },
} as const;

export type MasterKey = keyof typeof masterRegistry;

export function isMasterKey(value: string): value is MasterKey {
  return value in masterRegistry;
}

export async function listMaster(resource: MasterKey, q: string, page: number, status = "", limit = 10) {
  await dbConnect();
  const config = masterRegistry[resource];
  const filter: Record<string, unknown> = q
    ? { $or: config.search.map((field) => ({ [field]: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") })) }
    : {};
  if (status === "1" || status === "0") filter.isActive = status === "1";
  const size = [10, 25, 50, 100].includes(limit) ? limit : 10;
  const model = config.model as unknown as {
    countDocuments: (filter: object) => Promise<number>;
    find: (filter: object) => {
      sort: (sort: object) => {
        skip: (n: number) => {
          limit: (n: number) => {
            populate: (path: string, select: string) => { lean: () => Promise<unknown[]> };
            lean: () => Promise<unknown[]>;
          };
        };
      };
    };
  };
  const safePage = Math.max(1, page || 1);
  const total = await model.countDocuments(filter);
  const query = model.find(filter).sort({ order: 1, name: 1, city: 1, label: 1, createdAt: -1 }).skip((safePage - 1) * size).limit(size);
  const items = resource === "subcategories" ? await query.populate("category", "name slug").lean() : await query.lean();
  return { items, total, page: safePage, pages: Math.max(1, Math.ceil(total / size)) };
}
