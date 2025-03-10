#!/bin/bash

# Script para executar a aplicação no ambiente de produção
echo "Iniciando a aplicação em modo de produção..."

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
  echo "Instalando dependências..."
  npm install
fi

# Verificar se o build do frontend existe
if [ ! -d "client/dist" ]; then
  echo "Compilando o frontend..."
  cd client
  npm install
  npm run build
  cd ..
fi

# Iniciar o servidor
echo "Iniciando o servidor..."
node server/index.js