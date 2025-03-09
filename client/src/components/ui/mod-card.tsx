import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Loader2, Download, Star, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "./form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertCommentSchema, type Mod, type Comment } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface ModCardProps {
  mod: Mod;
}

export function ModCard({ mod }: ModCardProps) {
  const [showComments, setShowComments] = useState(false);
  const { toast } = useToast();

  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: [`/api/mods/${mod.id}/comments`],
    enabled: showComments,
  });

  const form = useForm({
    resolver: zodResolver(insertCommentSchema),
    defaultValues: {
      modId: mod.id,
      name: "",
      content: "",
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (data: unknown) => {
      const res = await apiRequest("POST", `/api/mods/${mod.id}/comments`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/mods/${mod.id}/comments`] });
      form.reset();
      toast({ title: "Comentário adicionado" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar comentário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rateMutation = useMutation({
    mutationFn: async (rating: number) => {
      const res = await apiRequest("POST", `/api/mods/${mod.id}/rate`, { rating });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mods"] });
      toast({ title: "Avaliação registrada" });
    },
  });

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <div className="aspect-video relative">
        <img 
          src={mod.imageUrl} 
          alt={mod.title}
          className="object-cover w-full h-full"
        />
      </div>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold">{mod.title}</CardTitle>
            <CardDescription className="line-clamp-2">{mod.description}</CardDescription>
          </div>
          <div className="flex items-center gap-2 text-yellow-500">
            <span className="text-sm font-medium">
              {mod.numRatings > 0 ? (mod.rating / mod.numRatings).toFixed(1) : "N/A"}
            </span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="h-4 w-4 cursor-pointer"
                  fill={star <= (mod.rating / mod.numRatings) ? "currentColor" : "none"}
                  onClick={() => rateMutation.mutate(star)}
                />
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardFooter className="flex gap-2">
        <Button
          className="flex-1"
          onClick={() => window.open(mod.downloadUrl, '_blank')}
        >
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
        <Dialog open={showComments} onOpenChange={setShowComments}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <MessageSquare className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Comentários</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="max-h-[300px] overflow-y-auto space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="border-b pb-3">
                    <p className="font-medium">{comment.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleString()}
                    </p>
                    <p className="mt-1">{comment.content}</p>
                  </div>
                ))}
              </div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => commentMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comentário</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={commentMutation.isPending}>
                    {commentMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Enviar Comentário"
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}