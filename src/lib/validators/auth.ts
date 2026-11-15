import { z } from "zod";

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(60, "Name must be at most 60 characters")
  .regex(/^[A-Za-z]+(?:[ .'-][A-Za-z]+)*$/, "Use letters, spaces, and . ' - only");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(120, "Email is too long")
  .email("Enter a valid email");

export const phoneSchema = z.string().trim().refine((value) => value === "" || /^\+?[0-9]{7,15}$/.test(value), "Enter a valid phone number");

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(64, "Use at most 64 characters")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[0-9]/, "Include a number")
  .regex(/[^A-Za-z0-9]/, "Include a special character");

export function passwordAvoidsEmail(password: string, email: string) {
  const local = email.split("@")[0]?.toLowerCase() || "";
  if (local.length < 3) return true;
  return !password.toLowerCase().includes(local);
}

export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((value) => value, "Accept the terms to continue"),
    website: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })
  .refine((data) => passwordAvoidsEmail(data.password, data.email), {
    path: ["password"],
    message: "Password cannot contain your email name",
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password").max(64),
  remember: z.boolean().optional(),
  website: z.string().optional(),
});

export const forgotSchema = z.object({
  email: emailSchema,
  website: z.string().optional(),
});

export const resetSchema = z
  .object({
    token: z.string().min(20),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const changeEmailSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"),
});

export const profileSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Enter your password"),
});

export const verifySchema = z.object({ token: z.string().min(20, "Invalid token") });

export function zodFieldErrors(error: z.ZodError) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export function passwordScore(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(4, score);
}
