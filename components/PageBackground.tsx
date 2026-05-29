export function PageBackground({ src }: { src: string }): React.ReactElement {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none">
      <img src={src} alt="" className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-background/95" />
    </div>
  );
}
