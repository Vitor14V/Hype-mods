import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/ui/sidebar";
import { ModForm, AnnouncementForm } from "@/components/ui/admin-forms";
import { useQuery } from "@tanstack/react-query";
import type { Announcement } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AdminPage() {
  const [_, setLocation] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (user && !user.isAdmin) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-[240px] p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
          
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-8">
              <ModForm />
              <Card>
                <CardHeader>
                  <CardTitle>Recent Announcements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px] pr-4">
                    {announcements.map((announcement) => (
                      <div key={announcement.id} className="mb-4 p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          {new Date(announcement.createdAt).toLocaleString()}
                        </p>
                        <p className="mt-2">{announcement.message}</p>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <AnnouncementForm />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
