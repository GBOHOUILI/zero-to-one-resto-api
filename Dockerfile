FROM node:20-alpine

WORKDIR /usr/src/app

# On copie uniquement les fichiers de dépendances d'abord
COPY package*.json ./
COPY prisma ./prisma/

# On utilise --network-timeout pour être plus patient avec la connexion
RUN npm install --network-timeout=1000000

# Maintenant on copie le reste
COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
