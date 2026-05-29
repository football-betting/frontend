export function PageBackground(): React.ReactElement {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none">
      <img
        src="/img/bg2.png"
        alt=""
        className="hidden md:block h-full w-full object-cover"
      />
      <img
        src="/img/bg1.png"
        alt=""
        className="md:hidden h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-background/85 md:bg-background/95" />
    </div>
  );
}
