import { useState } from "react";
import { User } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./dialog";
import { Label } from "./label";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User as UserIcon, Edit, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface UserProfileProps {
  userId: number;
}

export function UserProfile({ userId }: UserProfileProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const { data: user, isLoading } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
  });

  const isCurrentUser = currentUser?.id === userId;

  const updateProfileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(`/api/users/${userId}/profile`, {
        method: "PUT",
        body: formData,
      });
      if (!res.ok) throw new Error("Falha ao atualizar perfil");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      toast({ title: "Perfil atualizado com sucesso" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const reportUserMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await apiRequest("POST", `/api/users/${userId}/report`, { reportReason: reason });
      return res.json();
    },
    onSuccess: () => {
      setIsReportDialogOpen(false);
      toast({ title: "Usuário denunciado", description: "Nossa equipe irá analisar esta denúncia em breve." });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao denunciar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-muted animate-pulse" />
          </div>
          <div className="h-6 bg-muted rounded mt-4 animate-pulse" />
          <div className="h-20 bg-muted rounded mt-4 animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            Usuário não encontrado
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleProfileUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateProfileMutation.mutate(formData);
  };

  const handleReportSubmit = () => {
    if (!reportReason.trim()) {
      toast({
        title: "Motivo da denúncia é obrigatório",
        variant: "destructive",
      });
      return;
    }
    
    reportUserMutation.mutate(reportReason);
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Perfil de {user.username}
          {user.isProfileApproved && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
              Verificado
            </span>
          )}
          {user.isBanned && (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
              Banido
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="w-24 h-24">
            {user.profilePicture ? (
              <AvatarImage src={user.profilePicture} alt={user.username} />
            ) : (
              <AvatarFallback>
                <UserIcon className="h-12 w-12" />
              </AvatarFallback>
            )}
          </Avatar>

          <div className="text-center">
            <h3 className="text-lg font-medium">{user.username}</h3>
            <p className="text-muted-foreground mt-1">
              {user.bio || "Este usuário não possui uma biografia."}
            </p>
          </div>

          <div className="w-full flex justify-center gap-2 mt-4">
            {isCurrentUser ? (
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar Perfil
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Editar Perfil</DialogTitle>
                    <DialogDescription>
                      Atualize suas informações de perfil. A foto de perfil pode levar algum tempo para ser aprovada.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleProfileUpdate}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="profilePicture">Foto de Perfil</Label>
                        <Input 
                          id="profilePicture" 
                          name="profilePicture" 
                          type="file"
                          accept="image/*"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bio">Biografia</Label>
                        <Textarea 
                          id="bio" 
                          name="bio" 
                          rows={4}
                          placeholder="Fale um pouco sobre você..."
                          defaultValue={user.bio || ""}
                        />
                      </div>
                    </div>
                    
                    <DialogFooter className="mt-4">
                      <Button type="submit" disabled={updateProfileMutation.isPending}>
                        {updateProfileMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => setIsReportDialogOpen(true)}
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Denunciar Usuário
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      {/* Diálogo de denúncia */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Denunciar {user.username}</DialogTitle>
            <DialogDescription>
              Informe o motivo da denúncia. Nossa equipe irá analisar o caso.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reportReason">Motivo da Denúncia</Label>
              <Textarea 
                id="reportReason" 
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                rows={4}
                placeholder="Descreva o motivo da denúncia..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleReportSubmit}
              disabled={reportUserMutation.isPending}
            >
              {reportUserMutation.isPending ? "Enviando..." : "Enviar Denúncia"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}