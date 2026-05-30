import { LocaleSwitcher } from "@/components/LocaleSwitcher";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <>
      <div className="fixed top-4 right-4 z-20">
        <LocaleSwitcher />
      </div>
      {children}
    </>
  );
}
