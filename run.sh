#!/bin/bash

# Script para executar a aplicação no ambiente de produção
echo "Iniciando a aplicação em modo de produção..."

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
  echo "Instalando dependências..."
  npm install
fi

# Compilar o projeto
echo "Compilando o projeto..."
npm run build

# Iniciar o servidor
echo "Iniciando o servidor..."
npm run start