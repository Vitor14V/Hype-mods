import { useState } from "react";
import { User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Badge } from "./badge";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User as UserIcon, Check, Ban, UserX2 } from "lucide-react";

export function UserManagement() {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const { data: users, isLoading: isLoadingAllUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: reportedUsers, isLoading: isLoadingReportedUsers } = useQuery<User[]>({
    queryKey: ["/api/users/reported"],
  });

  const banUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("PUT", `/api/users/${userId}/ban`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/reported"] });
      toast({ title: "Usuário banido com sucesso" });
      setIsDetailsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao banir usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unbanUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("PUT", `/api/users/${userId}/unban`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/reported"] });
      toast({ title: "Usuário desbanido com sucesso" });
      setIsDetailsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao desbanir usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const approveProfileMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("PUT", `/api/users/${userId}/approve`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Perfil aprovado com sucesso" });
      setIsDetailsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao aprovar perfil",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUserDetails = (user: User) => {
    setSelectedUser(user);
    setIsDetailsDialogOpen(true);
  };

  const renderUserList = (userList: User[] | undefined, isLoading: boolean) => {
    if (isLoading) {
      return Array(3)
        .fill(0)
        .map((_, i) => (
          <Card key={i} className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                <div className="flex-1">
                  <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-24 bg-muted rounded mt-2 animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ));
    }

    if (!userList || userList.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum usuário encontrado
        </div>
      );
    }

    return userList.map((user) => (
      <Card key={user.id} className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar>
                {user.profilePicture ? (
                  <AvatarImage src={user.profilePicture} alt={user.username} />
                ) : (
                  <AvatarFallback>
                    <UserIcon className="h-5 w-5" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <div className="font-medium flex items-center gap-2">
                  {user.username}
                  {user.isAdmin && (
                    <Badge variant="outline" className="ml-2">
                      Admin
                    </Badge>
                  )}
                  {user.isBanned && (
                    <Badge variant="destructive" className="ml-2">
                      Banido
                    </Badge>
                  )}
                </div>
                {user.reportReason && (
                  <div className="text-sm text-red-500 mt-1">
                    Motivo da denúncia: {user.reportReason}
                  </div>
                )}
                {user.profilePicture && !user.isProfileApproved && (
                  <div className="text-sm text-amber-500 mt-1">
                    Foto de perfil pendente de aprovação
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleUserDetails(user)}
            >
              Detalhes
            </Button>
          </div>
        </CardContent>
      </Card>
    ));
  };

  return (
    <div>
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">Todos os Usuários</TabsTrigger>
          <TabsTrigger value="reported">Usuários Denunciados</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          {renderUserList(users, isLoadingAllUsers)}
        </TabsContent>
        <TabsContent value="reported" className="mt-4">
          {renderUserList(reportedUsers, isLoadingReportedUsers)}
        </TabsContent>
      </Tabs>

      {selectedUser && (
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes do Usuário</DialogTitle>
              <DialogDescription>
                Gerencie as informações e permissões do usuário.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="flex flex-col items-center space-y-2">
                <Avatar className="w-20 h-20">
                  {selectedUser.profilePicture ? (
                    <AvatarImage src={selectedUser.profilePicture} alt={selectedUser.username} />
                  ) : (
                    <AvatarFallback>
                      <UserIcon className="h-10 w-10" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="text-xl font-semibold">{selectedUser.username}</div>
                {selectedUser.bio && (
                  <div className="text-center text-muted-foreground mt-2">{selectedUser.bio}</div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {selectedUser.profilePicture && !selectedUser.isProfileApproved && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => approveProfileMutation.mutate(selectedUser.id)}
                    disabled={approveProfileMutation.isPending}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    {approveProfileMutation.isPending ? "Aprovando..." : "Aprovar Foto de Perfil"}
                  </Button>
                )}
                
                {selectedUser.isBanned ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unbanUserMutation.mutate(selectedUser.id)}
                    disabled={unbanUserMutation.isPending}
                  >
                    <UserX2 className="mr-2 h-4 w-4" />
                    {unbanUserMutation.isPending ? "Processando..." : "Desbanir Usuário"}
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => banUserMutation.mutate(selectedUser.id)}
                    disabled={banUserMutation.isPending}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    {banUserMutation.isPending ? "Banindo..." : "Banir Usuário"}
                  </Button>
                )}
              </div>

              {selectedUser.reportReason && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <h4 className="text-sm font-medium text-red-800">Motivo da Denúncia:</h4>
                  <p className="text-sm text-red-700 mt-1">{selectedUser.reportReason}</p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}