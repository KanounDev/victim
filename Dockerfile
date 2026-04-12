# Use full node:18 image (not slim/alpine) so standard Linux utilities are available
FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Application runs as the default root user (no non-root user created)
EXPOSE 3000

CMD ["node", "server.js"]
