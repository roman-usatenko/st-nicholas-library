FROM node:20-slim AS build
WORKDIR /build
COPY . ./
RUN npm install && npm run build && npx tsc && rm -r node_modules

FROM node:20-slim
USER node
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY --chown=node:node --from=build /build ./
RUN npm ci --only=production
CMD [ "node", "out/backend/backend.js" ]
