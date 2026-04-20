export function SkeletonLine({ width = 'w-full', height = 'h-4' }) {
  return (
    <div className={`${width} ${height} bg-gray-100 rounded-lg animate-pulse`} />
  );
}

export function SkeletonInsightCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-80 flex-shrink-0 overflow-hidden">
      <div className="h-1 bg-gray-100 animate-pulse" />
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-100 animate-pulse" />
          <div className="w-20 h-4 rounded-full bg-gray-100 animate-pulse" />
        </div>
        <SkeletonLine width="w-4/5" height="h-4" />
        <SkeletonLine width="w-full" height="h-3" />
        <SkeletonLine width="w-3/4" height="h-3" />
        <SkeletonLine width="w-28" height="h-6" />
      </div>
    </div>
  );
}

export function SkeletonFullCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
        <SkeletonLine width="w-24" height="h-4" />
      </div>
      <SkeletonLine width="w-3/4" height="h-5" />
      <SkeletonLine width="w-full" height="h-3" />
      <SkeletonLine width="w-5/6" height="h-3" />
      <div className="flex gap-2">
        <SkeletonLine width="w-24" height="h-8" />
        <SkeletonLine width="w-16" height="h-8" />
      </div>
    </div>
  );
}

export function SkeletonSubScore() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
        <SkeletonLine width="w-24" height="h-4" />
      </div>
      <SkeletonLine width="w-full" height="h-2" />
      <SkeletonLine width="w-1/2" height="h-3" />
      <SkeletonLine width="w-3/4" height="h-3" />
    </div>
  );
}
