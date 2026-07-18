export function ScreenSkeleton() {
  return (
    <div className="w-full min-h-screen p-6 flex flex-col gap-6" style={{ background: 'var(--color-bg-base)' }}>
      <div>
        <div className="h-5 w-48 shimmer rounded-lg mb-2"></div>
        <div className="h-3 w-32 shimmer rounded-lg"></div>
      </div>
      
      <div className="h-32 shimmer rounded-[24px] w-full"></div>
      
      <div className="flex gap-4">
        <div className="h-24 shimmer rounded-[24px] flex-1 flex flex-col justify-between p-4">
          <div className="h-3 w-16 shimmer rounded-lg"></div>
          <div className="h-8 w-16 shimmer rounded-lg"></div>
        </div>
        <div className="h-24 shimmer rounded-[24px] flex-1 flex flex-col justify-between p-4">
          <div className="h-3 w-16 shimmer rounded-lg"></div>
          <div className="h-8 w-16 shimmer rounded-lg"></div>
        </div>
      </div>
      
      <div className="h-64 shimmer rounded-[24px] w-full mt-4"></div>
    </div>
  );
}
