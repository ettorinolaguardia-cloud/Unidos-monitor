# Stage 1: Compilazione di Angular con Node 22
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx ng build --configuration production

# Stage 2: Server Web leggero per mostrare l'app
FROM nginx:alpine

# Rimuove la pagina di benvenuto predefinita di Nginx per evitare conflitti
RUN rm -rf /usr/share/nginx/html/*

# Copia i file compilati di Angular dal primo stage (inclusa la cartella browser)
COPY --from=builder /app/dist/Unidos/browser /usr/share/nginx/html

EXPOSE 80
