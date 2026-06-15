# Multi-stage build: Angular 19 + PrimeNG 19 (Node 20 compat fork) → static files served by nginx.

FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies first to leverage layer caching.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Copy source and build. The OpenAPI schema is expected to be committed.
COPY . .
RUN npm run build -- --configuration production

FROM nginx:1.27-alpine AS runtime

# Runtime config: SPA fallback + long cache on hashed assets.
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Angular output lives under dist/<project>/browser.
COPY --from=build /app/dist/fox-runner/browser /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
