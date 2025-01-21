# Use uma imagem Node.js como base
FROM node:18-slim

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos package.json e package-lock.json
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o restante do código do projeto
COPY . .

# Exponha a porta do aplicativo
EXPOSE 8080

# Inicia o servidor
CMD ["node", "index.js"]
