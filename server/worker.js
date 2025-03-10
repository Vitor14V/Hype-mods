// Script para executar em segundo plano
// Este worker atua como um keep-alive para manter o aplicativo online

// Importa o http para poder fazer requisições ao próprio servidor
import http from 'http';

// Configuração de intervalos
const PING_INTERVAL = 10 * 60 * 1000; // 10 minutos em milissegundos

// Função para fazer ping no servidor principal
function pingServer() {
  try {
    // Só executa o ping se não estiver no Render (que já tem seu próprio sistema de keep-alive)
    if (!process.env.RENDER) {
      console.log(`[Worker] Fazendo ping no servidor em: ${new Date().toISOString()}`);

      const PORT = process.env.PORT || 5000;

      // Faz uma requisição para o próprio servidor na rota de status
      const options = {
        hostname: 'localhost',
        port: PORT,
        path: '/api/status',
        method: 'GET'
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          console.log(`[Worker] Ping concluído com status: ${res.statusCode}`);
        });
      });

      req.on('error', (error) => {
        console.error(`[Worker] Erro no ping: ${error.message}`);
      });

      req.end();
    }
  } catch (error) {
    console.error(`[Worker] Erro ao fazer ping: ${error.message}`);
  }
}

// Iniciar o worker apenas se não estiver no Render
console.log('[Worker] Verificando ambiente para iniciar worker de keep-alive...');
if (!process.env.RENDER) {
  setInterval(pingServer, PING_INTERVAL);
  console.log('[Worker] Keep-alive worker ativado');
} else {
  console.log('[Worker] Ambiente Render detectado, worker de keep-alive não será iniciado');
}

// Exportar para poder ser importado pelo servidor principal
export default { 
  start: () => {
    if (!process.env.RENDER) {
      console.log('[Worker] Keep-alive worker ativado');

      // Esperar 10 segundos antes do primeiro ping para garantir que o servidor esteja online
      setTimeout(() => {
        console.log('[Worker] Realizando ping inicial após inicialização do servidor');
        pingServer();
      }, 10 * 1000);
    }
  }
};