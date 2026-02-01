import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function HistoryLoading() {
  return (
    <div className="space-y-6">
      <header>
        <Skeleton className="h-9 w-3/4 mb-2" />
        <Skeleton className="h-5 w-1/2" />
      </header>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Skeleton className="h-7 w-48" />
            <div className="flex w-full sm:w-auto items-center gap-2">
              <Skeleton className="h-10 w-full sm:max-w-xs" />
              <Skeleton className="h-10 w-[200px]" />
              <Skeleton className="h-10 w-[180px]" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
