import { getBrand } from "@/lib/brand";

export function PageBackground(): React.ReactElement {
  const { bgDesktop, bgMobile } = getBrand().assets;
  return (
    <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none">
      <img
        src={bgDesktop}
        alt=""
        className="hidden md:block h-full w-full object-cover"
      />
      <img
        src={bgMobile}
        alt=""
        className="md:hidden h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-background/85 md:bg-background/95" />
    </div>
  );
}
