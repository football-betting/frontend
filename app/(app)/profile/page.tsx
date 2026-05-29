import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";

export default async function ProfilePage(): Promise<never> {
  const { user } = await getCurrentSession();
  if (!user) {
    redirect("/login");
  }
  redirect(`/user/${user.id}`);
}
