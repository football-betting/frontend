import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { LoginForm } from "./login-form";

interface LoginPageProps {
  searchParams: Promise<{ registered?: string }>;
}

export default async function LoginPage({
  searchParams,
}: LoginPageProps): Promise<React.ReactElement> {
  const { user } = await getCurrentSession();
  if (user) {
    redirect("/");
  }

  const params = await searchParams;
  const registered = params.registered === "true";

  return (
    <main
      className="flex min-h-screen items-center justify-center p-margin-mobile md:p-0"
      style={{
        background:
          "radial-gradient(circle at 50% -20%, #292a2e 0%, #121317 70%)",
      }}
    >
      <div className="w-full max-w-[440px] z-10">
        <div className="mb-lg text-center">
          <h1 className="text-headline-lg font-black text-on-background uppercase tracking-tighter">
            TOURNAMENT PREDICTOR
          </h1>
          <p className="text-body-sm text-on-surface-variant mt-xs opacity-60">
            Office Tournament Pool
          </p>
        </div>

        <div className="bg-surface-container border border-outline-variant p-xl shadow-2xl">
          {registered ? (
            <p
              aria-live="polite"
              className="mb-lg text-body-sm text-on-secondary-container bg-secondary-container px-md py-sm"
            >
              Account created. Sign in below.
            </p>
          ) : null}

          <LoginForm />

          <div className="text-center pt-lg">
            <Link
              className="text-secondary text-label-caps uppercase hover:text-tertiary transition-colors border-b border-transparent hover:border-tertiary pb-1"
              href="/signup"
            >
              Create an account
            </Link>
          </div>
        </div>

        <div className="mt-xl text-center">
          <p className="text-data-mono uppercase text-on-surface-variant opacity-40">
            © 2026 Tournament Predictor
          </p>
        </div>
      </div>
    </main>
  );
}
