import { NextResponse } from "next/server";

export type ApiBody<T = unknown> = {
  success: boolean;
  message: string;
  errors?: Record<string, string>;
  data?: T;
};

export function ok<T>(message: string, data?: T, status = 200) {
  return NextResponse.json({ success: true, message, data } satisfies ApiBody<T>, { status });
}

export function fail(message: string, status = 400, errors?: Record<string, string>) {
  return NextResponse.json({ success: false, message, errors } satisfies ApiBody, { status });
}

export async function readJson(req: Request) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}
