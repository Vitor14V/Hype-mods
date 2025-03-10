import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertModSchema, insertAnnouncementSchema } from "@shared/schema";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./form";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./card";
import { useToast } from "@/hooks/use-toast";
import { Image, Loader2, Trash2, Edit, Plus, RefreshCw } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogDescription,
  DialogFooter
} from "./dialog";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";
import { Badge } from "./badge";

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

export function ModsManagement() {
  const { toast } = useToast();
  const [selectedMod, setSelectedMod] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);

  const { data: mods = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/mods"]
  });

  const editForm = useForm({
    resolver: zodResolver(insertModSchema.partial()),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      downloadUrl: "",
    }
  });

  // Reset form values when selected mod changes
  React.useEffect(() => {
    if (selectedMod) {
      editForm.reset({
        title: selectedMod.title,
        description: selectedMod.description,
        imageUrl: selectedMod.imageUrl,
        downloadUrl: selectedMod.downloadUrl,
        tags: selectedMod.tags,
      });
    }
  }, [selectedMod, editForm]);

  const updateMutation = useMutation({
    mutationFn: async (data: unknown) => {
      const res = await apiRequest("PUT", `/api/mods/${selectedMod.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mods"] });
      toast({ title: "Mod atualizado com sucesso" });
      setIsEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Erro ao atualizar mod",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/mods/${selectedMod.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mods"] });
      toast({ title: "Mod excluído com sucesso" });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Erro ao excluir mod",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const handleEdit = (mod: any) => {
    setSelectedMod(mod);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (mod: any) => {
    setSelectedMod(mod);
    setIsDeleteDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gerenciar Mods</CardTitle>
          <CardDescription>Edite ou exclua mods existentes</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : mods.length === 0 ? (
          <Alert>
            <AlertTitle>Nenhum mod encontrado</AlertTitle>
            <AlertDescription>
              Não há mods cadastrados no sistema. Use o formulário "Adicionar Novo Mod" para criar.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Versão</TableHead>
                  <TableHead className="hidden md:table-cell">Avaliação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mods.map((mod: any) => (
                  <TableRow key={mod.id}>
                    <TableCell className="font-medium">{mod.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{mod.version}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {mod.numRatings > 0 ? (
                        <span>{(mod.rating / mod.numRatings).toFixed(1)} ⭐ ({mod.numRatings})</span>
                      ) : (
                        <span className="text-muted-foreground">Sem avaliações</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(mod)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                          onClick={() => handleDelete(mod)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Editar Mod</DialogTitle>
              <DialogDescription>
                Atualize as informações do mod "{selectedMod?.title}".
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form 
                onSubmit={editForm.handleSubmit((data) => updateMutation.mutate(data))}
                className="space-y-4"
              >
                <FormField
                  control={editForm.control}
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
                  control={editForm.control}
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
                  control={editForm.control}
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
                  control={editForm.control}
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
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar Alterações"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir o mod "{selectedMod?.title}"? Esta ação é irreversível.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  "Excluir Mod"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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