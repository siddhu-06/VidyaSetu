export function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)]">
      <div className="animate-pulse space-y-4">
        <div className="h-5 w-1/3 rounded-full bg-slate-200" />
        <div className="h-4 w-2/3 rounded-full bg-slate-100" />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="h-24 rounded-2xl bg-slate-100" />
          <div className="h-24 rounded-2xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

