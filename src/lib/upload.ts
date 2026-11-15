import { v2 as cloudinary } from "cloudinary";
import { MAX_IMAGE_BYTES } from "./constants";

const TYPES: Record<string, { ext: string; check: (buf: Buffer) => boolean }> = {
  "image/jpeg": { ext: "jpg", check: (buf) => buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff },
  "image/png": { ext: "png", check: (buf) => buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 },
  "image/webp": {
    ext: "webp",
    check: (buf) => buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP",
  },
};

export function inspectImage(file: File, buffer: Buffer) {
  if (buffer.length > MAX_IMAGE_BYTES) return "Each image must be 5 MB or smaller";
  const rule = TYPES[file.type];
  if (!rule || !rule.check(buffer)) return "Upload a JPG, PNG, or WebP image";
  return null;
}

export function cloudinaryReady() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

export async function uploadImage(buffer: Buffer, folder: string) {
  if (!cloudinaryReady()) throw new Error("Image uploads are not configured. Add Cloudinary keys to .env.local.");
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  const dataUri = `data:image/jpeg;base64,${buffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(dataUri, { folder, resource_type: "image" });
  return { url: result.secure_url, publicId: result.public_id };
}
