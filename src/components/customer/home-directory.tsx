"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Briefcase, Car, Home, KeyRound, PawPrint, ShoppingBag, Users, Wrench, type LucideIcon } from "lucide-react";

const columnOrder = ["vehicles", "for-rent", "pets", "items-for-sale", "services", "real-estate", "community", "jobs"];

const looks: Record<string, { icon: LucideIcon; tile: string; chip: string; text: string }> = {
  vehicles: { icon: Car, tile: "from-emerald-400 to-green-600", chip: "hover:bg-emerald-500/10 hover:text-emerald-700 hover:border-emerald-500/30 dark:hover:text-emerald-300", text: "text-emerald-600" },
  "for-rent": { icon: KeyRound, tile: "from-indigo-400 to-blue-700", chip: "hover:bg-indigo-500/10 hover:text-indigo-700 hover:border-indigo-500/30 dark:hover:text-indigo-300", text: "text-indigo-600" },
  pets: { icon: PawPrint, tile: "from-orange-400 to-red-500", chip: "hover:bg-orange-500/10 hover:text-orange-700 hover:border-orange-500/30 dark:hover:text-orange-300", text: "text-orange-600" },
  "items-for-sale": { icon: ShoppingBag, tile: "from-sky-400 to-cyan-600", chip: "hover:bg-sky-500/10 hover:text-sky-700 hover:border-sky-500/30 dark:hover:text-sky-300", text: "text-sky-600" },
  services: { icon: Wrench, tile: "from-amber-400 to-orange-600", chip: "hover:bg-amber-500/10 hover:text-amber-700 hover:border-amber-500/30 dark:hover:text-amber-300", text: "text-amber-600" },
  "real-estate": { icon: Home, tile: "from-lime-400 to-green-600", chip: "hover:bg-lime-500/10 hover:text-lime-700 hover:border-lime-500/30 dark:hover:text-lime-300", text: "text-lime-600" },
  community: { icon: Users, tile: "from-violet-400 to-purple-700", chip: "hover:bg-violet-500/10 hover:text-violet-700 hover:border-violet-500/30 dark:hover:text-violet-300", text: "text-violet-600" },
  jobs: { icon: Briefcase, tile: "from-rose-400 to-pink-600", chip: "hover:bg-rose-500/10 hover:text-rose-700 hover:border-rose-500/30 dark:hover:text-rose-300", text: "text-rose-600" },
};

type Category = { name: string; slug: string; icon: string };
type Sub = { name: string; slug: string };

export function HomeDirectory({
  categories,
  subsByCategory,
}: {
  categories: Category[];
  subsByCategory: Record<string, Sub[]>;
}) {
  const reduce = useReducedMotion();
  const ordered = [...categories].sort((a, b) => {
    const left = columnOrder.indexOf(a.slug);
    const right = columnOrder.indexOf(b.slug);
    return (left === -1 ? 99 : left) - (right === -1 ? 99 : right);
  });

  return (
    <div className="pb-8 pt-4">
      <h1 className="sr-only">Browse all categories</h1>
      <section className="mx-auto max-w-[1440px] px-3 sm:px-5">
        <div className="gap-3 sm:columns-2 lg:columns-3 xl:columns-4">
          {ordered.map((category, index) => {
            const subs = [...(subsByCategory[category.slug] || [])].sort((a, b) => a.name.localeCompare(b.name));
            const look = looks[category.slug] || looks.community;
            const Icon = look.icon;
            return (
              <motion.article
                key={category.slug}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduce ? 0 : index * 0.04, duration: 0.3 }}
                className="mb-3 break-inside-avoid rounded-2xl border bg-card/80 p-3.5 shadow-soft backdrop-blur transition-shadow hover:shadow-lg"
              >
                <Link href={`/category/${category.slug}`} className="group flex items-center gap-3">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${look.tile} text-white shadow-sm ring-1 ring-black/5`}>
                    <Icon className="h-5 w-5" strokeWidth={2.2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-base font-bold leading-tight tracking-tight">{category.name}</span>
                    <span className="block text-[11px] font-medium text-muted-foreground">{subs.length} categories</span>
                  </span>
                  <ArrowUpRight className={`h-4 w-4 shrink-0 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${look.text}`} />
                </Link>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {subs.map((sub) => (
                    <li key={sub.slug}>
                      <Link
                        href={`/category/${category.slug}/${sub.slug}`}
                        className={`block rounded-full border border-transparent bg-muted/70 px-2.5 py-1 text-[12.5px] font-medium leading-4 text-slate-600 transition dark:text-slate-300 ${look.chip}`}
                      >
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
