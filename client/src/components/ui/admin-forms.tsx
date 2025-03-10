import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertModSchema, insertAnnouncementSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./form";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { useToast } from "@/hooks/use-toast";
import { Image, Loader2 } from "lucide-react";

export function ModForm() {
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(insertModSchema),
  });

  const mutation = useMutation({
    mutationFn: async (data: unknown) => {
      const res = await apiRequest("POST", "/api/mods", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mods"] });
      toast({ title: "Mod adicionado com sucesso" });
      form.reset();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Erro ao adicionar mod",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adicionar Novo Mod</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Imagem</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const formData = new FormData();
                            formData.append("file", file);
                            try {
                              const res = await fetch("/api/upload", {
                                method: "POST",
                                body: formData,
                              });
                              
                              if (!res.ok) {
                                throw new Error(`Erro: ${res.status} ${res.statusText}`);
                              }
                              
                              const data = await res.json();
                              console.log("Upload bem-sucedido:", data);
                              onChange(data.url);
                              
                              toast({
                                title: "Imagem enviada com sucesso",
                                description: "A imagem foi carregada e está pronta para uso",
                                variant: "default",
                              });
                            } catch (error) {
                              console.error("Erro detalhado de upload:", error);
                              toast({
                                title: "Erro ao fazer upload da imagem",
                                description: error instanceof Error ? error.message : "Tente novamente",
                                variant: "destructive",
                              });
                            }
                          }
                        }}
                        {...field}
                      />
                      {value && (
                        <div className="relative aspect-video rounded-lg border">
                          <img
                            src={value}
                            alt="Preview"
                            className="object-cover rounded-lg w-full h-full"
                          />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="downloadUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link para Download</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full" 
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                "Adicionar Mod"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export function AnnouncementForm() {
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(insertAnnouncementSchema),
  });

  const mutation = useMutation({
    mutationFn: async (data: unknown) => {
      const res = await apiRequest("POST", "/api/announcements", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({ title: "Anúncio publicado" });
      form.reset();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Erro ao publicar anúncio",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Publicar Anúncio</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensagem</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publicando...
                </>
              ) : (
                "Publicar Anúncio"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}