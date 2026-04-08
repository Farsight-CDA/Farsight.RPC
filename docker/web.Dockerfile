FROM node:22-bookworm-slim AS build

WORKDIR /source
COPY Farsight.Rpc.Web/package.json Farsight.Rpc.Web/package-lock.json ./
RUN npm ci

COPY Farsight.Rpc.Web/ ./
RUN npm run build

FROM nginx:1.29-alpine AS runtime

COPY --from=build /source/.output/public/ /usr/share/nginx/html/
COPY docker/web.nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
