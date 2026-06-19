# Image commune à l'API et au front (mêmes dépendances)
FROM node:20-alpine

WORKDIR /app

# Installer les dépendances (cache Docker tant que package*.json ne change pas)
COPY package*.json ./
RUN npm install

# Copier le reste du code
COPY . .

# 3001 = API Node · 5173 = serveur de dev Vite
EXPOSE 3001 5173

# Par défaut on lance l'API ; le service "web" surcharge cette commande
CMD ["node", "server/local-api.mjs"]
