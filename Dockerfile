FROM node:22-alpine

RUN apk add --no-cache su-exec

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force

COPY . .
COPY data/ /opt/seug-seed/data/
COPY public/data/ /opt/seug-seed/public-data/
COPY docker/entrypoint.sh /usr/local/bin/seug-entrypoint

RUN sed -i 's/\r$//' /usr/local/bin/seug-entrypoint \
    && chmod +x /usr/local/bin/seug-entrypoint \
    && mkdir -p /app/node_modules/.cache \
    && chown -R node:node /app/node_modules/.cache /opt/seug-seed

EXPOSE 8080 5174

ENTRYPOINT ["seug-entrypoint"]
CMD ["npm", "run", "serve", "--", "--host", "0.0.0.0", "--port", "8080"]
