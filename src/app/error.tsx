"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <h1 className="text-3xl font-semibold">Something went wrong</h1>
        <p className="mt-3 text-muted-foreground">Please try that again. If it keeps happening, check the database connection.</p>
        <button onClick={reset} className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
          Try again
        </button>
      </div>
    </main>
  );
}
