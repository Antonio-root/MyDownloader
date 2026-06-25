# 1. Etapa de compilación (Build)
FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2. Etapa de producción (Run)
FROM node:20-bookworm-slim AS runner
WORKDIR /app

# Instalar python3 y ffmpeg en el contenedor (requisitos de yt-dlp)
RUN apt-get update && apt-get install -y python3 ffmpeg curl && rm -rf /var/lib/apt/lists/*

# Descargar e instalar el binario de yt-dlp dentro del contenedor
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && chmod a+rx /usr/local/bin/yt-dlp

# Copiar solo lo necesario desde la etapa de compilación
COPY package*.json ./
RUN npm install --only=production
COPY --from=builder /app/dist ./dist

EXPOSE 3004
ENV NODE_ENV=production
ENV PORT=3004

CMD ["node", "dist/index.js"]