import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Flag } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface CommentReportButtonProps {
  commentId: number;
}

export function CommentReportButton({ commentId }: CommentReportButtonProps) {
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const reportMutation = useMutation({
    mutationFn: async ({ commentId, reason }: { commentId: number; reason: string }) => {
      return await apiRequest("POST", `/api/comments/${commentId}/report`, { reportReason: reason });
    },
    onSuccess: () => {
      toast({
        title: "Comentário denunciado",
        description: "Sua denúncia foi enviada para análise dos administradores.",
      });
      setOpen(false);
      setReason("");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao denunciar comentário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleReport = () => {
    if (!reason.trim()) {
      toast({
        title: "Erro ao denunciar",
        description: "Por favor, forneça um motivo para a denúncia.",
        variant: "destructive",
      });
      return;
    }

    reportMutation.mutate({ commentId, reason });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-destructive">
          <Flag className="h-3.5 w-3.5 mr-1" /> Denunciar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Denunciar comentário</DialogTitle>
          <DialogDescription>
            Informe o motivo pelo qual você está denunciando este comentário.
            Nossa equipe irá analisar a denúncia.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Label htmlFor="report-reason" className="mb-2">
            Motivo da denúncia
          </Label>
          <Textarea
            id="report-reason"
            placeholder="Descreva por que este comentário deve ser denunciado..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            onClick={handleReport}
            disabled={reportMutation.isPending}
          >
            {reportMutation.isPending ? "Enviando..." : "Enviar Denúncia"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}