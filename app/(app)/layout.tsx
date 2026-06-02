import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { PageBackground } from "@/components/PageBackground";
import { Footer } from "@/components/Footer";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const { user } = await getCurrentSession();
  if (!user) {
    redirect("/login");
  }
  return (
    <>
      <PageBackground />
      {/* Sticky footer: the content area grows to fill the viewport so the
          footer always sits at the bottom and never floats up while a page's
          data is still loading. */}
      <div className="flex min-h-dvh flex-col">
        <div className="flex-1">{children}</div>
        <Footer />
      </div>
    </>
  );
}
