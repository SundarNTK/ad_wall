import Image from "next/image";

/**
 * One logo (AdWall_FullLogo.png, dark "Ad") for both themes.
 * Light theme: plain logo, no background.
 * Dark theme (or glass=true): a small, mild frosted-white glass plate sits behind it so the dark letters read.
 */
export function BrandLogo({ className = "h-[38px]", priority = false, alt = "AdWall", glass = false }: { className?: string; priority?: boolean; alt?: string; glass?: boolean }) {
  const plate = "rounded-2xl bg-white/85 px-3 py-1.5 shadow-[0_8px_24px_-14px_rgba(255,255,255,0.35)] ring-1 ring-white/30 backdrop-blur-md";
  return (
    <span className={`inline-flex shrink-0 items-center ${glass ? plate : "dark:rounded-2xl dark:bg-white/85 dark:px-3 dark:py-1.5 dark:shadow-[0_8px_24px_-14px_rgba(255,255,255,0.35)] dark:ring-1 dark:ring-white/30 dark:backdrop-blur-md"}`}>
      <Image src="/AdWall_FullLogo.png" alt={alt} width={950} height={231} priority={priority} className={`${className} w-auto`} />
    </span>
  );
}
