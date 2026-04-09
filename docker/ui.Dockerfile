FROM node:22-alpine AS build
WORKDIR /app
COPY src/ui/package.json src/ui/package-lock.json ./
RUN npm ci
COPY src/ui/ ./
RUN npm run build

FROM alpine:3.20
RUN apk add --no-cache nginx nginx-mod-http-brotli
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
CMD ["nginx", "-g", "daemon off;"]
