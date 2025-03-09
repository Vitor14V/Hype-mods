import { useQuery } from "@tanstack/react-query";
import { ModCard } from "@/components/ui/mod-card";
import { Sidebar } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";
import type { Mod, Announcement } from "@shared/schema";

export default function HomePage() {
  const { data: mods = [] } = useQuery<Mod[]>({
    queryKey: ["/api/mods"],
  });

  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-[240px] p-8">
        <div className="max-w-7xl mx-auto">
          {announcements.length > 0 && (
            <div className="mb-8 space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Anúncios
              </h2>
              <div className="space-y-3">
                {announcements.map((announcement) => (
                  <Card key={announcement.id} className="bg-muted/50">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">
                        {new Date(announcement.createdAt).toLocaleString()}
                      </p>
                      <p>{announcement.message}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <h1 className="text-4xl font-bold mb-8">Mods Disponíveis</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mods.map((mod) => (
              <ModCard key={mod.id} mod={mod} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}