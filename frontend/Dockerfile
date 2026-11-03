# Стадия 1: сборка статики
FROM node:22-alpine AS build

WORKDIR /app

# pnpm через corepack (входит в Node)
RUN corepack enable

COPY frontend/package.json frontend/pnpm-workspace.yaml frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY frontend/ ./
RUN pnpm build

# Стадия 2: раздача статики nginx'ом
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80