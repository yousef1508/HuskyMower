import { Mower } from "@shared/schema";
import MowerCard from "./mower-card";
import { Skeleton } from "@/components/ui/skeleton";

interface MowerListProps {
  mowers: Mower[];
  isLoading: boolean;
}

export default function MowerList({ mowers, isLoading }: MowerListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-secondary/50 rounded-lg p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="flex-1"></div>
              <div className="flex flex-wrap gap-4 items-center">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-6 w-40" />
              </div>
            </div>
            <div className="mt-4">
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!mowers || mowers.length === 0) {
    return (
      <div className="bg-secondary/50 rounded-lg p-8 text-center">
        <h3 className="text-lg font-medium mb-2">No mowers found</h3>
        <p className="text-muted-foreground">
          You haven't added any mowers yet. Add your first mower to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {mowers.map((mower) => (
        <MowerCard key={mower.id} mower={mower} />
      ))}
    </div>
  );
}
