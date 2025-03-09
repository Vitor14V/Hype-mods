import { useState } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/ui/sidebar";
import { ModForm, AnnouncementForm } from "@/components/ui/admin-forms";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Announcement } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ADMIN_PASSWORD = 'ADM2555';

export default function AdminPage() {
  const [_, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const { toast } = useToast();

  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/announcements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({ title: "Anúncio removido com sucesso" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover anúncio",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthorized(true);
    } else {
      toast({
        title: "Senha incorreta",
        variant: "destructive"
      });
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="lg:pl-[240px] p-8">
          <div className="max-w-md mx-auto mt-20">
            <Card>
              <CardHeader>
                <CardTitle>Admin Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  type="password"
                  placeholder="Senha de admin"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
                <Button className="w-full" onClick={handleLogin}>
                  Entrar
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
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
                  <CardTitle>Anúncios Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px] pr-4">
                    {announcements.map((announcement) => (
                      <div key={announcement.id} className="mb-4 p-4 bg-muted rounded-lg relative group">
                        <p className="text-sm text-muted-foreground">
                          {new Date(announcement.createdAt).toLocaleString()}
                        </p>
                        <p className="mt-2">{announcement.message}</p>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover anúncio?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. O anúncio será removido permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteAnnouncementMutation.mutate(announcement.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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