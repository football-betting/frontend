import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { SignupForm } from "./signup-form";

export default async function SignupPage(): Promise<React.ReactElement> {
  const { user } = await getCurrentSession();
  if (user) {
    redirect("/");
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center p-md"
      style={{
        background:
          "radial-gradient(circle at 50% -20%, #292a2e 0%, #121317 70%)",
      }}
    >
      <div className="w-full max-w-[600px]">
        <div className="flex flex-col items-center mb-xl">
          <h1 className="text-headline-lg font-black text-on-background uppercase tracking-tighter mb-xs">
            TOURNAMENT PREDICTOR
          </h1>
        </div>

        <div className="bg-surface-container border border-outline-variant rounded-lg p-lg shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

          <SignupForm />

          <div className="mt-lg pt-lg border-t border-outline-variant/20 text-center">
            <p className="text-body-sm text-on-surface-variant">
              Already part of the league?{" "}
              <Link className="text-tertiary hover:underline" href="/login">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
