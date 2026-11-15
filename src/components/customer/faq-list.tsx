"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export function FaqList({ items }: { items: { question: string; answer: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const base = useId();
  return (
    <div className="mt-6 space-y-3">
      {items.map((item, index) => {
        const isOpen = open === index;
        const panel = `${base}-panel-${index}`;
        return (
          <div
            key={item.question}
            className={`overflow-hidden rounded-2xl border bg-card transition-[border-color,box-shadow] duration-200 ${isOpen ? "border-primary/40 shadow-soft" : "hover:border-primary/30"}`}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panel}
              onClick={() => setOpen(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <span className={`text-[15px] font-semibold transition-colors ${isOpen ? "text-primary" : ""}`}>{item.question}</span>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                  isOpen ? "rotate-180 bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                <ChevronDown className="h-4 w-4" />
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panel}
                  role="region"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <p className="border-t px-5 pb-5 pt-4 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
