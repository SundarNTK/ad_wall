import mongoose, { Schema } from "mongoose";

const MessageSchema = new Schema(
  {
    ad: { type: Schema.Types.ObjectId, ref: "Ad", required: true, index: true },
    fromName: { type: String, required: true },
    fromEmail: { type: String, required: true },
    body: { type: String, required: true },
    toUser: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const ReportSchema = new Schema(
  {
    ad: { type: Schema.Types.ObjectId, ref: "Ad", required: true, index: true },
    type: { type: String, required: true, index: true },
    email: { type: String, required: true },
    url: { type: String, default: "" },
    comment: { type: String, default: "" },
    status: { type: String, enum: ["open", "resolved", "dismissed"], default: "open", index: true },
    handledBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

const FavoriteSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    ad: { type: Schema.Types.ObjectId, ref: "Ad", required: true, index: true },
  },
  { timestamps: true },
);
FavoriteSchema.index({ user: 1, ad: 1 }, { unique: true });

const SavedSearchSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    label: { type: String, required: true },
    query: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

const AuditSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true, index: true },
    target: { type: String, default: "" },
    meta: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const RefreshSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    jti: { type: String, required: true, unique: true },
    tokenHash: { type: String, required: true },
    portal: { type: String, enum: ["customer", "admin"], required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
    replacedBy: { type: String },
  },
  { timestamps: true },
);

export const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema);
export const Report = mongoose.models.Report || mongoose.model("Report", ReportSchema);
export const Favorite = mongoose.models.Favorite || mongoose.model("Favorite", FavoriteSchema);
export const SavedSearch = mongoose.models.SavedSearch || mongoose.model("SavedSearch", SavedSearchSchema);
export const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", AuditSchema);
export const RefreshToken = mongoose.models.RefreshToken || mongoose.model("RefreshToken", RefreshSchema);
