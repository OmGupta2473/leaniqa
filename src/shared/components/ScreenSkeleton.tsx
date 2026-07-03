export function ScreenSkeleton() {
  return (
    <div className="w-full min-h-screen p-6 animate-pulse flex flex-col gap-6 bg-background-primary">
      <div className="h-8 bg-border-tertiary rounded-md w-1/3 mb-4"></div>
      <div className="h-32 bg-background-secondary rounded-xl w-full border border-border-tertiary"></div>
      <div className="flex gap-4">
        <div className="h-24 bg-background-secondary rounded-xl flex-1 border border-border-tertiary"></div>
        <div className="h-24 bg-background-secondary rounded-xl flex-1 border border-border-tertiary"></div>
      </div>
      <div className="h-64 bg-background-secondary rounded-xl w-full mt-4 border border-border-tertiary"></div>
    </div>
  );
}
