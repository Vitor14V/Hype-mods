import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Comment, Mod } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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

export function ReportedComments() {
  const { toast } = useToast();

  const { data: reportedComments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ["/api/comments/reported"],
  });

  const { data: mods = [] } = useQuery<Mod[]>({
    queryKey: ["/api/mods"],
  });

  const resolveReportMutation = useMutation({
    mutationFn: async (commentId: number) => {
      return await apiRequest("PUT", `/api/comments/${commentId}/resolve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comments/reported"] });
      toast({
        title: "Denúncia resolvida",
        description: "A denúncia foi marcada como resolvida.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao resolver denúncia",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Função para obter o nome do mod pelo ID
  const getModName = (modId: number) => {
    const mod = mods.find(m => m.id === modId);
    return mod ? mod.title : "Mod desconhecido";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Comentários Denunciados
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center">Carregando denúncias...</div>
        ) : reportedComments.length === 0 ? (
          <div className="py-8 text-center">Não há comentários denunciados</div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {reportedComments.map((comment) => (
                <div key={comment.id} className="bg-muted p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{comment.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Mod: {getModName(comment.modId)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Data: {new Date(comment.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="shrink-0">
                          <CheckCircle className="h-4 w-4 mr-1" /> Resolver
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Resolver denúncia?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja marcar esta denúncia como resolvida?
                            O comentário não será mais exibido como denunciado.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => resolveReportMutation.mutate(comment.id)}
                          >
                            Resolver
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  
                  <Separator className="my-2" />
                  
                  <div className="my-2">
                    <h5 className="text-sm font-medium mb-1">Comentário:</h5>
                    <p className="text-sm bg-background p-2 rounded">
                      {comment.content}
                    </p>
                  </div>
                  
                  <div className="mt-3">
                    <h5 className="text-sm font-medium mb-1">Motivo da denúncia:</h5>
                    <p className="text-sm text-red-500 bg-red-500/10 p-2 rounded">
                      {comment.reportReason}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}