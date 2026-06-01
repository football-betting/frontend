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
      {children}
      <Footer />
    </>
  );
}
