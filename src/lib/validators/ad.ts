import { z } from "zod";
import { emailSchema, nameSchema, phoneSchema } from "./auth";

export const fieldDefSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]{0,30}$/, "Use a short lowercase key"),
  label: z.string().trim().min(1).max(40),
  type: z.enum(["text", "number", "select"]),
  options: z.array(z.string().trim().min(1)).default([]),
  required: z.boolean().default(false),
  filterable: z.boolean().default(false),
});

export const adInputSchema = z
  .object({
    categoryId: z.string().min(1, "Choose a category"),
    subCategoryId: z.string().min(1, "Choose a subcategory"),
    title: z.string().trim().min(5, "Title is too short").max(100),
    description: z.string().trim().min(20, "Add a bit more detail").max(8000),
    price: z.coerce.number().min(0).max(100000000).optional(),
    priceType: z.enum(["fixed", "negotiable", "free", "contact"]),
    attributes: z.record(z.union([z.string(), z.number()])).default({}),
    images: z
      .array(z.object({ url: z.string().url(), publicId: z.string().optional().default("") }))
      .max(5, "You can upload up to 5 photos"),
    contactName: nameSchema,
    contactEmail: emailSchema,
    contactPhone: phoneSchema,
    showPhone: z.boolean().default(false),
    locationId: z.string().min(1, "Choose a location from the list"),
    city: z.string().trim().min(2, "Enter the city").max(80, "City name is too long"),
    zip: z.string().trim().max(12).optional().or(z.literal("")),
    lat: z.number().min(-90).max(90).nullable().optional(),
    lng: z.number().min(-180).max(180).nullable().optional(),
    durationDays: z.coerce.number({ invalid_type_error: "Choose how long the ad stays live" }).int().positive("Choose how long the ad stays live"),
    isPrivateSeller: z.boolean().default(true),
    website: z.string().optional(),
  })
  .refine((data) => data.priceType === "contact" || data.priceType === "free" || typeof data.price === "number", {
    path: ["price"],
    message: "Enter a price",
  });

export const contactSellerSchema = z.object({
  fromName: nameSchema,
  fromEmail: emailSchema,
  body: z.string().trim().min(10, "Write a short message").max(2000),
  website: z.string().optional(),
});

export const reportSchema = z.object({
  type: z.string().min(2).max(40),
  email: emailSchema,
  comment: z.string().trim().max(1000).optional().or(z.literal("")),
  url: z.string().max(300).optional().or(z.literal("")),
  website: z.string().optional(),
});

export const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  message: z.string().trim().min(10).max(2000),
  website: z.string().optional(),
});

export const savedSearchSchema = z.object({
  label: z.string().trim().min(2).max(80),
  query: z.record(z.string()).default({}),
});

export const adminUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  role: z.enum(["admin", "superadmin"]),
  mode: z.enum(["password", "invite"]),
  password: z.string().optional(),
});
