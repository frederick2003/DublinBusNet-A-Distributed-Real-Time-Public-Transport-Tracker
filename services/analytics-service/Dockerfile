FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
# Use `npm install` when package-lock.json is not present (ci requires a lockfile).
RUN npm install --production
COPY . .
EXPOSE 4000
CMD [ "node", "index.js" ]
