// Script para manter o aplicativo sempre online
const https = require('https');
const http = require('http');

// URL do seu aplicativo Replit (substitua pela URL real do seu projeto)
const url = process.env.REPLIT_URL || 'https://seu-projeto.replit.app';

console.log(`Configurando ping automático para: ${url}`);

// Função para fazer ping no site
function pingServer() {
  console.log(`Fazendo ping em: ${url} - ${new Date().toISOString()}`);
  
  try {
    // Determinar se devemos usar http ou https
    const requester = url.startsWith('https') ? https : http;
    
    const req = requester.get(url, (res) => {
      console.log(`Ping concluído com status: ${res.statusCode}`);
    });
    
    req.on('error', (error) => {
      console.error(`Erro ao fazer ping: ${error.message}`);
    });
    
    req.end();
  } catch (error) {
    console.error(`Erro no ping: ${error.message}`);
  }
}

// Executar o ping a cada 5 minutos (300000 ms)
setInterval(pingServer, 300000);

// Executar um ping imediatamente ao iniciar
pingServer();

console.log('Serviço de keep-alive iniciado com sucesso!');