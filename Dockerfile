# KwijtCalc draait volledig in de browser. Deze container levert alleen de
# gebouwde bestanden uit; er is geen server, database of API bij betrokken.

# 1. Bouwen
FROM node:22-alpine AS build
WORKDIR /app

# Optioneel: de submap waaronder de site komt te staan, bijvoorbeeld
# /kwijtcalc. Leeg laten als de site op een eigen adres draait.
ARG BASE_PATH=""
ENV BASE_PATH=$BASE_PATH

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build:static

# 2. Uitleveren
FROM nginx:alpine AS runtime
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/out /usr/share/nginx/html
EXPOSE 8080
