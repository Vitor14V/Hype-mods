
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UpdatesPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-primary">Atualizações Recentes</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">Versão 2.0 - Atualização de Carnaval</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="font-semibold text-lg">Novos Recursos</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Tema de Carnaval Brasileiro com cores vibrantes e elementos festivos</li>
              <li>Perfis de usuário aprimorados com imagens personalizadas</li>
              <li>Sistema de denúncia de comentários inapropriados</li>
              <li>Sistema de anúncios para comunicações importantes</li>
              <li>Animação introdutória ao abrir o site</li>
              <li>Novo painel administrativo com ferramentas de moderação</li>
            </ul>
            
            <h3 className="font-semibold text-lg">Melhorias</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Função de pesquisa avançada para encontrar mods com tags específicas</li>
              <li>Sistema de banimento de usuários para melhorar a moderação</li>
              <li>Upload de imagens para mods com limite de 5MB</li>
              <li>Interface responsiva para celulares e tablets</li>
              <li>Suporte a WebSockets para notificações em tempo real</li>
            </ul>
            
            <h3 className="font-semibold text-lg">Novos Conteúdos</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Pacote de Fantasias de Carnaval</li>
              <li>Instrumentos de Bateria de Samba</li>
              <li>Cenários de Blocos de Rua</li>
              <li>Efeitos sonoros temáticos de carnaval</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Próximas Atualizações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="list-disc pl-6 space-y-2">
              <li>Chat ao vivo entre usuários</li>
              <li>Sistema de conquistas para criadores de mods</li>
              <li>Integração com plataformas de jogos populares</li>
              <li>Eventos sazonais com temas brasileiros</li>
              <li>Suporte a múltiplos idiomas</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
