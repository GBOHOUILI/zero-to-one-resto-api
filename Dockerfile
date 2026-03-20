# Image de base légère
FROM node:20-alpine

# Répertoire de travail
WORKDIR /usr/src

# Copie des fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installation des dépendances
RUN npm install

# Copie du reste du code
COPY . .

# Génération du client Prisma (Crucial pour ton service)
RUN npx prisma generate

# Build de l'application NestJS
RUN npm run build

# Port d'écoute
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "run", "start:prod"]
