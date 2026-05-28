export default function Page() {
  return (
    <main className="mx-auto flex min-h-screen max-w-(--container-max-desktop) flex-col items-start justify-center gap-md p-margin-mobile lg:p-margin-desktop">
      <span className="text-label-caps uppercase text-on-surface-variant">
        FE-001
      </span>
      <h1 className="text-display text-on-background">Bootstrap OK</h1>
      <p className="text-body-lg text-on-surface">
        Next.js + Tailwind v4 + Drizzle + Lucia scaffold is wired up.
      </p>
    </main>
  );
}
