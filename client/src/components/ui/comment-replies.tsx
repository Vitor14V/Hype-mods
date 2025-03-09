import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Comment, InsertComment } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { User as UserIcon, CornerDownRight, Reply } from "lucide-react";
import { CommentReportButton } from "./comment-report-button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "./form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const replySchema = z.object({
  content: z.string().min(1, { message: "A resposta não pode estar vazia" }),
});

type ReplyFormValues = z.infer<typeof replySchema>;

interface CommentRepliesProps {
  comment: Comment;
  modId: number;
}

export function CommentReplies({ comment, modId }: CommentRepliesProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState(false);
  
  const form = useForm<ReplyFormValues>({
    resolver: zodResolver(replySchema),
    defaultValues: {
      content: "",
    },
  });
  
  const { data: replies, isLoading } = useQuery<Comment[]>({
    queryKey: [`/api/comments/${comment.id}/replies`],
    enabled: expandedReplies,
  });
  
  const createReplyMutation = useMutation({
    mutationFn: async (values: ReplyFormValues) => {
      const replyData: InsertComment = {
        modId,
        replyToId: comment.id,
        name: user?.username || "Anônimo",
        content: values.content,
      };
      
      const res = await apiRequest("POST", `/api/mods/${modId}/comments`, replyData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/comments/${comment.id}/replies`] });
      queryClient.invalidateQueries({ queryKey: [`/api/mods/${modId}/comments`] });
      form.reset();
      setShowReplyForm(false);
      toast({ title: "Resposta enviada com sucesso" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar resposta",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: ReplyFormValues) => {
    createReplyMutation.mutate(values);
  };
  
  const toggleReplies = () => {
    setExpandedReplies(!expandedReplies);
  };
  
  const handleReplyClick = () => {
    if (!user) {
      toast({
        title: "Faça login para responder",
        variant: "destructive",
      });
      return;
    }
    
    setShowReplyForm(!showReplyForm);
  };
  
  return (
    <div className="ml-4 border-l-2 border-muted pl-4 mt-2">
      <div className="flex justify-between items-center mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleReplies}
          className="px-2 h-8"
        >
          <CornerDownRight className="h-4 w-4 mr-1" />
          {expandedReplies ? "Ocultar respostas" : "Ver respostas"}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReplyClick}
          className="px-2 h-8"
        >
          <Reply className="h-4 w-4 mr-1" />
          Responder
        </Button>
      </div>
      
      {showReplyForm && (
        <div className="mb-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea 
                        placeholder="Escreva sua resposta..." 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReplyForm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createReplyMutation.isPending}
                >
                  {createReplyMutation.isPending ? "Enviando..." : "Enviar"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}
      
      {expandedReplies && (
        <div className="space-y-3 mt-2">
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-12 bg-muted rounded-md" />
              <div className="h-12 bg-muted rounded-md" />
            </div>
          ) : !replies || replies.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              Nenhuma resposta ainda.
            </p>
          ) : (
            replies.map((reply) => (
              <div key={reply.id} className="border-t border-muted pt-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <UserIcon className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{reply.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(reply.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{reply.content}</p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <CommentReportButton commentId={reply.id} />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}