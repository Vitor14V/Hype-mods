import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SupportTicket, InsertSupportTicket, UpdateSupportTicket } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "./form";
import { Textarea } from "./textarea";
import { Input } from "./input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Badge } from "./badge";
import { LifeBuoy, MessageSquare, PlusCircle } from "lucide-react";

const supportTicketSchema = z.object({
  subject: z.string().min(3, { message: "O assunto deve conter pelo menos 3 caracteres" }),
  message: z.string().min(10, { message: "A mensagem deve conter pelo menos 10 caracteres" }),
});

const supportResponseSchema = z.object({
  responseMessage: z.string().min(1, { message: "A resposta não pode estar vazia" }),
  status: z.enum(["pendente", "em_andamento", "resolvido"]),
});

type SupportTicketFormValues = z.infer<typeof supportTicketSchema>;
type SupportResponseFormValues = z.infer<typeof supportResponseSchema>;

function TicketStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "aberto":
      return <Badge variant="secondary">Aberto</Badge>;
    case "em_andamento":
      return <Badge variant="outline">Em andamento</Badge>;
    case "resolvido":
      return <Badge variant="default" className="bg-green-500">Resolvido</Badge>;
    default:
      return null;
  }
}

export function SupportTicketList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  
  const { data: tickets, isLoading } = useQuery<SupportTicket[]>({
    queryKey: ["/api/support"],
  });
  
  const form = useForm<SupportTicketFormValues>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: {
      subject: "",
      message: "",
    },
  });
  
  const responseForm = useForm<SupportResponseFormValues>({
    resolver: zodResolver(supportResponseSchema),
    defaultValues: {
      responseMessage: "",
      status: "em_andamento",
    },
  });
  
  const createTicketMutation = useMutation({
    mutationFn: async (values: SupportTicketFormValues) => {
      const ticketData: InsertSupportTicket = {
        ...values,
        userId: user?.id || 0,
      };
      
      const res = await apiRequest("POST", "/api/support", ticketData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support"] });
      form.reset();
      toast({ title: "Ticket de suporte criado com sucesso" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar ticket",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateTicketMutation = useMutation({
    mutationFn: async (values: { ticketId: number; data: SupportResponseFormValues }) => {
      const ticketData: UpdateSupportTicket = {
        responseMessage: values.data.responseMessage,
        status: values.data.status,
      };
      
      const res = await apiRequest("PUT", `/api/support/${values.ticketId}`, ticketData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support"] });
      responseForm.reset();
      setIsResponseDialogOpen(false);
      toast({ title: "Resposta enviada com sucesso" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao responder ticket",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: SupportTicketFormValues) => {
    createTicketMutation.mutate(values);
  };
  
  const onResponseSubmit = (values: SupportResponseFormValues) => {
    if (!selectedTicket) return;
    
    updateTicketMutation.mutate({
      ticketId: selectedTicket.id,
      data: values,
    });
  };
  
  const handleRespondTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    responseForm.reset({
      responseMessage: "",
      status: (ticket.status as "pendente" | "em_andamento" | "resolvido") || "em_andamento",
    });
    setIsResponseDialogOpen(true);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Suporte</h2>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Ticket de Suporte</DialogTitle>
              <DialogDescription>
                Preencha as informações abaixo para solicitar ajuda da equipe.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Problema com download de mod" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva seu problema detalhadamente..." 
                          rows={5}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" disabled={createTicketMutation.isPending}>
                    {createTicketMutation.isPending ? "Enviando..." : "Enviar Ticket"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      {user?.isAdmin ? (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="open">Em aberto</TabsTrigger>
            <TabsTrigger value="resolved">Resolvidos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            {renderTicketList(tickets, isLoading, handleRespondTicket, user)}
          </TabsContent>
          
          <TabsContent value="open" className="mt-4">
            {renderTicketList(
              tickets?.filter(ticket => ticket.status !== "resolvido"),
              isLoading,
              handleRespondTicket,
              user
            )}
          </TabsContent>
          
          <TabsContent value="resolved" className="mt-4">
            {renderTicketList(
              tickets?.filter(ticket => ticket.status === "resolvido"),
              isLoading,
              handleRespondTicket,
              user
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <div>
          {renderTicketList(
            tickets?.filter(ticket => ticket.userId === user?.id),
            isLoading,
            handleRespondTicket,
            user
          )}
        </div>
      )}
      
      {selectedTicket && (
        <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Responder Ticket #{selectedTicket.id}</DialogTitle>
              <DialogDescription>
                {selectedTicket.subject}
              </DialogDescription>
            </DialogHeader>
            
            <div className="mb-4 p-3 bg-muted rounded-md">
              <p className="text-sm">
                {selectedTicket.message}
              </p>
            </div>
            
            {selectedTicket.responseMessage && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="text-sm font-medium text-blue-800">Resposta anterior:</h4>
                <p className="text-sm text-blue-700 mt-1">{selectedTicket.responseMessage}</p>
              </div>
            )}
            
            <Form {...responseForm}>
              <form onSubmit={responseForm.handleSubmit(onResponseSubmit)} className="space-y-4">
                <FormField
                  control={responseForm.control}
                  name="responseMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resposta</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Digite sua resposta..." 
                          rows={4}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {user?.isAdmin && (
                  <FormField
                    control={responseForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="aberto">Aberto</SelectItem>
                            <SelectItem value="em_andamento">Em andamento</SelectItem>
                            <SelectItem value="resolvido">Resolvido</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <DialogFooter>
                  <Button type="submit" disabled={updateTicketMutation.isPending}>
                    {updateTicketMutation.isPending ? "Enviando..." : "Enviar Resposta"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function renderTicketList(
  tickets: SupportTicket[] | undefined, 
  isLoading: boolean,
  onRespond: (ticket: SupportTicket) => void,
  currentUser: any
) {
  if (isLoading) {
    return Array(3)
      .fill(0)
      .map((_, i) => (
        <Card key={i} className="mb-4">
          <CardHeader>
            <div className="h-5 w-32 bg-muted rounded animate-pulse" />
            <div className="h-4 w-24 bg-muted rounded mt-2 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-16 bg-muted rounded animate-pulse" />
          </CardContent>
        </Card>
      ));
  }

  if (!tickets || tickets.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <LifeBuoy className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhum ticket de suporte encontrado</p>
          <p className="text-sm text-muted-foreground">
            Clique em "Novo Ticket" para solicitar ajuda
          </p>
        </CardContent>
      </Card>
    );
  }

  return tickets.map((ticket) => (
    <Card key={ticket.id} className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{ticket.subject}</CardTitle>
            <CardDescription>
              Ticket #{ticket.id} • {new Date(ticket.createdAt).toLocaleDateString()}
            </CardDescription>
          </div>
          <TicketStatusBadge status={ticket.status || "aberto"} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{ticket.message}</p>
        
        {ticket.responseMessage && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 mt-1" />
              <div>
                <p className="text-xs font-medium">Resposta da equipe:</p>
                <p className="text-sm mt-1">{ticket.responseMessage}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          onClick={() => onRespond(ticket)}
          disabled={ticket.status === "resolvido" && !currentUser?.isAdmin}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          {currentUser?.isAdmin ? "Responder" : "Adicionar comentário"}
        </Button>
      </CardFooter>
    </Card>
  ));
}