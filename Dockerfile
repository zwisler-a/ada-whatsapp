
FROM node:latest AS builder
WORKDIR /app/
COPY . .
RUN npm install
RUN npm run build

FROM node:18-alpine  
WORKDIR /app/
COPY --from=builder /app/dist/ ./
COPY package*.json ./
RUN npm ci --omit=dev
CMD [ "node", "index.js" ]