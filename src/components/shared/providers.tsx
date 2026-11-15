"use client";

import { MotionConfig } from "framer-motion";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { FeedbackHost } from "@/components/shared/feedback";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <MotionConfig reducedMotion="user">
        {children}
        <Toaster richColors closeButton position="top-center" />
        <FeedbackHost />
      </MotionConfig>
    </ThemeProvider>
  );
}
