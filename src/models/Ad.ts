import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ImageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: "" },
  },
  { _id: false },
);

const AdSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    subCategory: { type: Schema.Types.ObjectId, ref: "SubCategory", required: true, index: true },
    location: { type: Schema.Types.ObjectId, ref: "Location", required: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    price: { type: Number, default: 0 },
    priceType: { type: String, enum: ["fixed", "negotiable", "free", "contact"], default: "fixed" },
    attributes: { type: Schema.Types.Mixed, default: {} },
    images: { type: [ImageSchema], default: [] },
    contactName: { type: String, required: true },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String, default: "" },
    showPhone: { type: Boolean, default: false },
    city: { type: String, required: true },
    zip: { type: String, default: "" },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    status: {
      type: String,
      enum: ["pending", "live", "rejected", "expired", "deleted"],
      default: "pending",
      index: true,
    },
    rejectReason: { type: String, default: "" },
    expiresAt: { type: Date, index: true },
    renewedAt: { type: Date },
    durationDays: { type: Number, default: 180 },
    views: { type: Number, default: 0 },
    isPrivateSeller: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    adNumber: { type: Number, required: true, unique: true, index: true },
  },
  { timestamps: true },
);

AdSchema.index({ title: "text", description: "text" });
AdSchema.index({ createdAt: -1 });
AdSchema.index({ status: 1, category: 1, createdAt: -1 });

export type AdDoc = InferSchemaType<typeof AdSchema> & { _id: mongoose.Types.ObjectId };
export const Ad: Model<AdDoc> = mongoose.models.Ad || mongoose.model("Ad", AdSchema);
