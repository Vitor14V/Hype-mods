import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ModCard } from "@/components/ui/mod-card";
import { Sidebar } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bell, Search } from "lucide-react";
import type { Mod, Announcement } from "@shared/schema";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Query para buscar todos os mods (caso padrão)
  const { data: allMods = [] } = useQuery<Mod[]>({
    queryKey: ["/api/mods"],
    enabled: !isSearching
  });

  // Query para buscar mods pesquisados
  const { data: searchResults = [] } = useQuery<Mod[]>({
    queryKey: ["/api/mods/search", searchQuery],
    queryFn: async () => {
      const response = await fetch(`/api/mods/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error("Erro ao buscar mods");
      }
      return response.json();
    },
    enabled: isSearching
  });

  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(searchQuery.trim().length > 0);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
  };

  // Determine which mods to display
  const modsToDisplay = isSearching ? searchResults : allMods;

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

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-6">Mods Disponíveis</h1>
            
            <form onSubmit={handleSearch} className="flex gap-2 mb-6">
              <Input 
                type="text" 
                placeholder="Procurar mods..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full max-w-sm"
              />
              <Button type="submit" variant="default" size="icon">
                <Search className="h-4 w-4" />
              </Button>
              {isSearching && (
                <Button type="button" variant="ghost" size="sm" onClick={clearSearch}>
                  Limpar
                </Button>
              )}
            </form>

            {isSearching && (
              <div className="text-sm text-muted-foreground mb-4">
                Resultados para: <span className="font-medium">{searchQuery}</span>
                {searchResults.length === 0 ? (
                  <p className="mt-2">Nenhum mod encontrado para esta pesquisa.</p>
                ) : (
                  <p className="mt-2">{searchResults.length} {searchResults.length === 1 ? 'mod encontrado' : 'mods encontrados'}</p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modsToDisplay.map((mod) => (
              <ModCard key={mod.id} mod={mod} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}