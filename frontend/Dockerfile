# Stage 1: Build the Vite + React app
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Stage 2: Serve
FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

# Copy the build output from the previous stage
COPY --from=build /app/dist ./dist

EXPOSE 3003

CMD ["serve", "-s", "dist", "-l", "3003"]
