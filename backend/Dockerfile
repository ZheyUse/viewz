FROM node:20-alpine

RUN apk add --no-cache chromium

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm install -g concurrently

CMD ["sh", "-c", "concurrently \"node server.js\" \"node worker.js\""]