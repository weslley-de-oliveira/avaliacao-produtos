const SKELETON_KEYS = ['um', 'dois', 'tres', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];

type ProductGridSkeletonProps = {
  count?: number;
};

export function ProductGridSkeleton({ count = 6 }: ProductGridSkeletonProps) {
  return (
    <div aria-hidden="true" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {SKELETON_KEYS.slice(0, count).map((key) => (
        <div key={key} className="border border-ink/30 bg-paper">
          <div className="aspect-square w-full animate-pulse bg-ink/10 motion-reduce:animate-none" />
          <div className="space-y-2 p-5">
            <div className="h-5 w-full animate-pulse bg-ink/10 motion-reduce:animate-none" />
            <div className="h-5 w-2/3 animate-pulse bg-ink/10 motion-reduce:animate-none" />
          </div>
        </div>
      ))}
    </div>
  );
}
