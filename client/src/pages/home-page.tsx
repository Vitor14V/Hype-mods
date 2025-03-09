import { useQuery } from "@tanstack/react-query";
import { ModCard } from "@/components/ui/mod-card";
import { Sidebar } from "@/components/ui/sidebar";
import type { Mod } from "@shared/schema";

export default function HomePage() {
  const { data: mods = [] } = useQuery<Mod[]>({
    queryKey: ["/api/mods"],
  });

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-[240px] p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Available Mods</h1>
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
