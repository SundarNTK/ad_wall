import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const FieldSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, enum: ["text", "number", "select"], required: true },
    options: { type: [String], default: [] },
    required: { type: Boolean, default: false },
    filterable: { type: Boolean, default: false },
  },
  { _id: false },
);

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    icon: { type: String, default: "Tag" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const SubCategorySchema = new Schema(
  {
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    fields: { type: [FieldSchema], default: [] },
  },
  { timestamps: true },
);
SubCategorySchema.index({ category: 1, slug: 1 }, { unique: true });

const LocationSchema = new Schema(
  {
    country: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    zip: { type: String, default: "" },
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    slug: { type: String, required: true, unique: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
LocationSchema.index({ city: 1, state: 1, zip: 1 });

const KeywordSchema = new Schema(
  {
    word: { type: String, required: true, unique: true, lowercase: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const ExpirySchema = new Schema(
  {
    label: { type: String, required: true },
    days: { type: Number, required: true },
    order: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const ReportTypeSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const PageSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    content: { type: String, default: "" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const FaqSchema = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const SettingSchema = new Schema(
  {
    key: { type: String, default: "site", unique: true },
    siteName: { type: String, default: "AdWall" },
    logoUrl: { type: String, default: "" },
    contactEmail: { type: String, default: "hello@classinest.local" },
    moderationEnabled: { type: Boolean, default: true },
    maxImages: { type: Number, default: 5 },
    emailTemplates: {
      verify: { type: String, default: "" },
      reset: { type: String, default: "" },
      reject: { type: String, default: "" },
      contact: { type: String, default: "" },
      invite: { type: String, default: "" },
    },
  },
  { timestamps: true },
);

const CounterSchema = new Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 10000 },
});

export type CategoryDoc = InferSchemaType<typeof CategorySchema> & { _id: mongoose.Types.ObjectId };
export type SubCategoryDoc = InferSchemaType<typeof SubCategorySchema> & { _id: mongoose.Types.ObjectId };
export type LocationDoc = InferSchemaType<typeof LocationSchema> & { _id: mongoose.Types.ObjectId };
export type SettingDoc = InferSchemaType<typeof SettingSchema> & { _id: mongoose.Types.ObjectId };

export const Category: Model<CategoryDoc> = mongoose.models.Category || mongoose.model("Category", CategorySchema);
export const SubCategory: Model<SubCategoryDoc> =
  mongoose.models.SubCategory || mongoose.model("SubCategory", SubCategorySchema);
export const Location: Model<LocationDoc> = mongoose.models.Location || mongoose.model("Location", LocationSchema);
export const Keyword = mongoose.models.Keyword || mongoose.model("Keyword", KeywordSchema);
export const ExpiryOption = mongoose.models.ExpiryOption || mongoose.model("ExpiryOption", ExpirySchema);
export const ReportType = mongoose.models.ReportType || mongoose.model("ReportType", ReportTypeSchema);
export const Page = mongoose.models.Page || mongoose.model("Page", PageSchema);
export const Faq = mongoose.models.Faq || mongoose.model("Faq", FaqSchema);
export const Setting: Model<SettingDoc> = mongoose.models.Setting || mongoose.model("Setting", SettingSchema);
export const Counter = mongoose.models.Counter || mongoose.model("Counter", CounterSchema);
