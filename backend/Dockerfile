# 1. Usa l'immagine ufficiale di Node.js
FROM node:20-alpine

# 2. Crea la cartella dell'app nel container
WORKDIR /app

# 3. Copia i file dei pacchetti e installali
COPY package*.json ./
RUN npm ci

# 4. Copia tutto il codice del backend
COPY . .

# 5. Compila il progetto NestJS (crea la cartella dist)
RUN npm run build

# 6. Esponi la porta del backend
EXPOSE 3000

# 7. Avvia l'applicazione
CMD ["node", "dist/main.js"]

