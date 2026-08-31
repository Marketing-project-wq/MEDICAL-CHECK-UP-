# medicalcheckup.20fit.id — zero-dependency Node app.
# No build/install step: the server uses only Node built-ins.
FROM node:20-alpine
WORKDIR /app

# Copy manifest + source (there are no dependencies to install).
COPY package.json ./
COPY src ./src
COPY public ./public

ENV NODE_ENV=production
# The platform injects PORT; the server falls back to 3000 locally.
EXPOSE 3000
CMD ["node", "src/server.js"]
