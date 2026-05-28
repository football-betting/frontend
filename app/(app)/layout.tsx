import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const { user } = await getCurrentSession();
  if (!user) {
    redirect("/login");
  }
  return <>{children}</>;
}
