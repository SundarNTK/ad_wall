"use client";

import { BrandLogo } from "@/components/shared/brand-logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "@/components/shared/feedback";
import { z } from "zod";
import { api } from "@/lib/client";
import { forgotSchema, loginSchema, passwordScore, registerSchema, resetSchema } from "@/lib/validators/auth";

const labels = ["Too short", "Weak", "Fair", "Good", "Strong"];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-danger">{message}</p>;
}

export function AuthPanel({
  mode,
  portal,
  next,
  token,
}: {
  mode: "login" | "register" | "forgot" | "reset";
  portal: "customer" | "admin";
  next?: string;
  token?: string;
}) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [pending, setPending] = useState(false);
  const base = portal === "admin" ? "/api/admin/auth" : "/api/auth";
  const home = portal === "admin" ? "/admin" : next || "/";
  const schema = mode === "register" ? registerSchema : mode === "forgot" ? forgotSchema : mode === "reset" ? resetSchema : loginSchema;
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: (mode === "reset" ? { token, password: "", confirmPassword: "" } : mode === "register" ? { acceptTerms: false, phone: "", website: "" } : { remember: true, website: "" }) as never,
  });
  const password = String(form.watch("password" as never) || "");
  const score = passwordScore(password);

  async function onSubmit(values: z.infer<typeof schema>) {
    setPending(true);
    const path = mode === "login" ? "login" : mode === "register" ? "register" : mode === "forgot" ? "forgot-password" : "reset-password";
    const endpoint = mode === "register" ? "/api/auth/register" : `${base}/${path}`;
    const result = await api(endpoint, { method: "POST", body: JSON.stringify(values) });
    setPending(false);
    if (result.errors) {
      Object.entries(result.errors).forEach(([key, message]) => form.setError(key as never, { message }));
    }
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    (mode === "login" ? toast.quiet : toast.success)(result.message);
    if (mode === "forgot") return;
    if (mode === "reset") router.push(portal === "admin" ? "/admin/login?reset=1" : "/login?reset=1");
    else router.push(home);
    router.refresh();
  }

  const admin = portal === "admin";
  const field = admin
    ? "mt-1.5 h-10 w-full rounded-lg border border-harbor-200 bg-surface px-3 text-[14px] text-inkstone outline-none transition hover:border-harbor-300 focus:border-harbor-600 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.18)]"
    : "mt-1.5 w-full rounded-xl border bg-background px-3.5 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15";
  const labelClass = admin ? "block text-[13px] font-semibold text-brand" : "block text-sm font-medium";
  const title = mode === "login" ? "Welcome back" : mode === "register" ? "Create your account" : mode === "forgot" ? "Forgot password" : "Choose a new password";
  const sideTitle = portal === "admin" ? "Manage the marketplace from one calm desk." : "A quieter way to buy, sell, and find local help.";
  const sideBody = portal === "admin"
    ? "Review new ads, look after customers, and keep listings accurate before they go live."
    : "Post in minutes. Message sellers without exposing their email.";

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className={`relative hidden overflow-hidden p-12 text-white lg:flex ${admin ? "bg-gradient-to-br from-harbor-950 via-harbor-800 to-harbor-600" : "bg-slate-950"}`}>
        <div className={`absolute -left-20 top-0 h-72 w-72 rounded-full blur-3xl ${admin ? "bg-orange-400/25" : "bg-primary/50"}`} />
        <div className={`absolute bottom-0 right-0 h-80 w-80 rounded-full blur-3xl ${admin ? "bg-indigo-400/30" : "bg-accent/40"}`} />
        <div className="relative flex h-full flex-col justify-between">
          <Link href={admin ? "/admin/login" : "/"} className="inline-flex w-fit" aria-label="AdWall">
            <BrandLogo glass priority className="h-11" />
          </Link>
          <div>
            <h2 className="max-w-md font-display text-4xl font-extrabold leading-tight">{sideTitle}</h2>
            <p className="mt-4 max-w-md text-slate-300">{sideBody}</p>
          </div>
          <p className="text-sm text-slate-400">{portal === "admin" ? "Staff sign-in. Customers use the public login." : "Same password works on both portals when your role allows it."}</p>
        </div>
      </div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`relative flex items-center px-6 py-12 ${admin ? "bg-admin-bg" : "bg-muted/40"}`}>
        {admin && <ThemeToggle className="absolute right-5 top-5" />}
        <form onSubmit={form.handleSubmit(onSubmit)} className={`mx-auto w-full max-w-md border p-7 sm:p-8 ${admin ? "rounded-2xl border-harbor-200 bg-surface shadow-[0_30px_80px_-28px_rgba(30,27,75,0.45)]" : "rounded-3xl bg-card shadow-soft"}`} noValidate>
          <div>
            <Link href={admin ? "/admin/login" : "/"} className="mb-5 inline-flex lg:hidden" aria-label="AdWall">
              <BrandLogo priority />
            </Link>
            <p className={`text-xs font-bold uppercase tracking-[0.18em] ${admin ? "text-brand" : "text-primary"}`}>{portal === "admin" ? "Admin panel" : "Customer portal"}</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">{title}</h1>
          </div>
          <div className="mt-6 space-y-4">
          <input tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px]" {...form.register("website" as never)} />
          {mode === "register" && (
            <label className={labelClass}>Full name
              <input className={field} {...form.register("name" as never)} />
              <FieldError message={(form.formState.errors as { name?: { message?: string } }).name?.message} />
            </label>
          )}
          {mode !== "reset" && (
            <label className={labelClass}>Email
              <input type="email" autoComplete="email" className={field} {...form.register("email" as never)} />
              <FieldError message={(form.formState.errors as { email?: { message?: string } }).email?.message} />
            </label>
          )}
          {mode === "register" && (
            <label className={labelClass}>Phone <span className={`font-normal ${admin ? "text-inkmute" : "text-muted-foreground"}`}>(optional)</span>
              <input className={field} placeholder="+15551234567" {...form.register("phone" as never)} />
              <FieldError message={(form.formState.errors as { phone?: { message?: string } }).phone?.message} />
            </label>
          )}
          {mode !== "forgot" && (
            <label className={labelClass}>{mode === "reset" ? "New password" : "Password"}
              <span className="relative mt-1.5 block">
                <input type={show ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} className={`${field} mt-0 pr-11`} {...form.register("password" as never)} />
                <button type="button" aria-label={show ? "Hide password" : "Show password"} className={`absolute right-3 ${admin ? "top-2.5 text-brand" : "top-3 text-muted-foreground"}`} onClick={() => setShow((value) => !value)}>
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
              <FieldError message={(form.formState.errors as { password?: { message?: string } }).password?.message} />
            </label>
          )}
          {(mode === "register" || mode === "reset") && password && (
            <div>
              <div className="grid grid-cols-4 gap-1">
                {[0, 1, 2, 3].map((index) => <div key={index} className={`h-1.5 rounded-full ${score > index ? "bg-accent" : "bg-muted"}`} />)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{labels[score]} · 8+ chars, upper, lower, number, symbol</p>
            </div>
          )}
          {(mode === "register" || mode === "reset") && (
            <label className={labelClass}>Confirm password
              <input type={show ? "text" : "password"} className={field} {...form.register("confirmPassword" as never)} />
              <FieldError message={(form.formState.errors as { confirmPassword?: { message?: string } }).confirmPassword?.message} />
            </label>
          )}
          {mode === "login" && (
            <label className={`flex items-center gap-2 text-sm ${admin ? "text-inkstone" : ""}`}><input type="checkbox" className={admin ? "accent-harbor-600" : "accent-primary"} {...form.register("remember" as never)} /> Remember me</label>
          )}
          {mode === "register" && (
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1 accent-primary" {...form.register("acceptTerms" as never)} />
              <span>I accept the <Link className="font-medium text-primary underline" href="/terms">terms</Link> and <Link className="font-medium text-primary underline" href="/privacy">privacy policy</Link>.</span>
            </label>
          )}
          <FieldError message={(form.formState.errors as { acceptTerms?: { message?: string } }).acceptTerms?.message} />
          <button disabled={pending} className={admin ? "w-full rounded-md bg-harbor-600 py-2.5 text-[14px] font-semibold text-white shadow-[0_8px_20px_-10px_rgba(79,70,229,0.7)] transition hover:-translate-y-0.5 hover:bg-harbor-700 disabled:opacity-60" : "w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:brightness-110 disabled:opacity-60"}>
            {pending ? "Please wait…" : mode === "login" ? "Sign in" : mode === "register" ? "Create account" : mode === "forgot" ? "Send reset link" : "Update password"}
          </button>
          <div className="flex flex-wrap justify-between gap-2 text-sm">
            {mode === "login" && <Link className={`font-medium ${admin ? "text-brand" : "text-primary"}`} href={portal === "admin" ? "/admin/forgot-password" : "/forgot-password"}>Forgot password?</Link>}
            {portal === "customer" && mode === "login" && <Link className="font-medium text-primary" href="/register">Create an account</Link>}
            {portal === "customer" && mode === "register" && <Link className="font-medium text-primary" href="/login">Already registered? Sign in</Link>}
            {mode !== "login" && <Link className={`font-medium ${admin ? "text-brand" : "text-primary"}`} href={portal === "admin" ? "/admin/login" : "/login"}>Back to sign in</Link>}
          </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
