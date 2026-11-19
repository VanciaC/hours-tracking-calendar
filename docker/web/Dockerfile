# syntax=docker/dockerfile:1

# Entry point image: the built front end, served by Caddy.
# Build it from the repository root:
#   docker build -f docker/web/Dockerfile -t htc-web:prod .
FROM node:22-alpine AS build

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ .

# Same origin as the page: Caddy forwards /graphql to the router.
ARG VITE_GRAPHQL_URL=/graphql
ENV VITE_GRAPHQL_URL=$VITE_GRAPHQL_URL
ARG VITE_PRIVACY_CONTACT
ENV VITE_PRIVACY_CONTACT=$VITE_PRIVACY_CONTACT
RUN npm run build

FROM caddy:2-alpine

COPY docker/web/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv