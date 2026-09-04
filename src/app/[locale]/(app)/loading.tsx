import { Skeleton } from "@/components/ui/skeleton";

/** هيكل تحميل عام لكل صفحات (app) أثناء انتقال المسار — يطابق تخطيط: عنوان + مؤشرات + جدول. */
export default function AppSegmentLoading() {
  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-5">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-lg" />
        ))}
      </div>

      <Skeleton className="h-10 w-full max-w-md rounded-md" />

      <div className="surface-card space-y-3 p-4">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-9 w-full" />
        ))}
      </div>
    </div>
  );
}
