import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Note } from "@shared/schema";
import { Link } from "wouter";

export default function MaintenanceNotes() {
  const { data: notes, isLoading } = useQuery({
    queryKey: ["/api/notes/recent"],
    staleTime: 30000,
  });

  // Take only the first 3 notes to display
  const recentNotes = notes?.slice(0, 3);

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="flex justify-between items-center px-4 py-3 border-b border-border">
        <h3 className="font-medium text-base">Recent Maintenance Notes</h3>
        <Link href="/maintenance">
          <Button variant="link" className="text-sm text-primary">View All</Button>
        </Link>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeleton
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-secondary/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-12 w-full mb-2" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))
          ) : !recentNotes || recentNotes.length === 0 ? (
            // Empty state
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">No maintenance notes found</p>
              <Link href="/maintenance">
                <Button className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" /> Add Maintenance Note
                </Button>
              </Link>
            </div>
          ) : (
            // Notes list
            <>
              {recentNotes.map((note: Note & { mower?: { name: string } }) => (
                <div key={note.id} className="bg-secondary/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{note.title}</h4>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-3">
                    {note.content}
                  </p>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{note.mower?.name || "Unknown Mower"}</span>
                    <span>By: {note.createdBy || "Unknown"}</span>
                  </div>
                </div>
              ))}

              <Link href="/maintenance">
                <Button className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" /> Add New Maintenance Note
                </Button>
              </Link>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
