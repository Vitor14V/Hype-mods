// Script para executar em segundo plano
// Este worker atua como um keep-alive para manter o aplicativo online

// Importa o http para poder fazer requisições ao próprio servidor
import http from 'http';

// Configuração de intervalos
const PING_INTERVAL = 10 * 60 * 1000; // 10 minutos em milissegundos
const PORT = process.env.PORT || 5000;

// Função para fazer ping no servidor principal
function pingServer() {
  try {
    console.log(`[Worker] Fazendo ping no servidor em: ${new Date().toISOString()}`);
    
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
  } catch (error) {
    console.error(`[Worker] Erro ao fazer ping: ${error.message}`);
  }
}

// Iniciar o worker
console.log('[Worker] Iniciando worker de keep-alive...');
setInterval(pingServer, PING_INTERVAL);

// Verificar se o servidor está online após 30 segundos (tempo para inicialização)
setTimeout(pingServer, 30 * 1000);

// Exportar para poder ser importado pelo servidor principal
export default { 
  start: () => {
    console.log('[Worker] Keep-alive worker ativado');
    pingServer();
  }
};