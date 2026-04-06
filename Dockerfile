# ===================== STAGE 1: BUILD =====================
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Configuration npm pour éviter les erreurs réseau
RUN npm config set registry https://registry.npmjs.org/ \
    && npm config set fetch-retries 5 \
    && npm config set fetch-retry-factor 2

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma/
COPY . .

RUN npx prisma generate
RUN npm run build

# ===================== STAGE 2: PRODUCTION =====================
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production --prefer-offline || npm ci --only=production

# Copie du build complet
COPY --from=builder /usr/src/app/dist ./dist

# Copie Prisma (client + schéma)
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/prisma ./prisma

EXPOSE 3000

# ←←← IMPORTANT : le fichier est dans dist/src/main.js
CMD ["node", "dist/src/main.js"]