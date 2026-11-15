import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="text-sm font-semibold text-accent">404</p>
        <h1 className="mt-2 text-4xl font-semibold">This page wandered off</h1>
        <p className="mt-3 text-muted-foreground">The listing or page you wanted is not here.</p>
        <Link href="/" className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
          Back home
        </Link>
      </div>
    </main>
  );
}
