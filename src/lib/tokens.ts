import { SignJWT, jwtVerify } from "jose";
import { createHash, randomBytes } from "crypto";
import type { Portal, Role } from "./constants";

export type TokenPayload = {
  sub: string;
  role: Role;
  tv: number;
  portal: Portal;
  typ: "access" | "refresh";
  jti?: string;
};

function key(kind: "access" | "refresh") {
  const raw = kind === "access" ? process.env.JWT_SECRET : process.env.JWT_REFRESH_SECRET;
  if (!raw) throw new Error(`Missing ${kind === "access" ? "JWT_SECRET" : "JWT_REFRESH_SECRET"}`);
  return new TextEncoder().encode(raw);
}

export async function signToken(payload: TokenPayload, seconds: number) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${seconds}s`)
    .sign(key(payload.typ === "access" ? "access" : "refresh"));
}

export async function readToken(token: string, kind: "access" | "refresh") {
  const { payload } = await jwtVerify(token, key(kind));
  return payload as unknown as TokenPayload;
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("hex");
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function newJti() {
  return randomBytes(16).toString("hex");
}
